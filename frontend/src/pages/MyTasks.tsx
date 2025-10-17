import TasksList from "@/components/organs/tasks/TaskList"
import { useTaskUpdates } from "@/hooks/use-task-updates";
import { useGetTasksQuery } from '@/services/taskApi';


export default function MyTasks() {
    const data = useTaskUpdates()
    const { data: myTasksData, isLoading, error } = useGetTasksQuery()
    return <TasksList tasksData={myTasksData} isLoading={isLoading} error={error} listeningToUpdates={!!data} />

}