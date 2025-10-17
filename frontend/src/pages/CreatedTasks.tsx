import TasksList from "@/components/organs/tasks/TaskList"
import { useGetCreatedTasksQuery } from '@/services/taskApi';


export default function CreatedTasks() {

    const { data: createdTasksData, isLoading, error } = useGetCreatedTasksQuery()
    return <TasksList tasksData={createdTasksData} isLoading={isLoading} error={error} />

}