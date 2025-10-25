import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('tasks_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not connected to Google Tasks' },
      { status: 401 }
    );
  }

  try {
    // Get all task lists
    const listsResponse = await fetch(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listsResponse.ok) {
      if (listsResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', connected: false },
          { status: 401 }
        );
      }
      throw new Error('Failed to fetch task lists');
    }

    const listsData = await listsResponse.json();

    interface GoogleTaskList {
      id: string;
      title: string;
    }

    // Get tasks from each list
    const allTasks = [];
    for (const list of (listsData.items || []) as GoogleTaskList[]) {
      const tasksResponse = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();

        interface GoogleTask {
          id: string;
          title: string;
          status: string;
          due?: string;
          notes?: string;
          updated: string;
        }

        const tasks = (tasksData.items || []).map((task: GoogleTask) => ({
          id: task.id,
          title: task.title,
          listName: list.title,
          listId: list.id,
          status: task.status,
          due: task.due,
          notes: task.notes,
          updated: task.updated,
        }));

        allTasks.push(...tasks);
      }
    }

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
