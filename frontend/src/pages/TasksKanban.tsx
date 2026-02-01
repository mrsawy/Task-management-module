import TasksKanban from "@/components/organs/tasks/TasksKanban";
import { useTaskUpdates } from "@/hooks/use-task-updates";
import { useGetTasksQuery } from '@/services/taskApi';

export default function TasksKanbanPage() {
    const data = useTaskUpdates();
    const { data: tasksData, isLoading, error } = useGetTasksQuery();
    return (
        <TasksKanban 
            tasksData={tasksData} 
            isLoading={isLoading} 
            error={error} 
            listeningToUpdates={!!data} 
        />
    );
}
