'use client'

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

// Validation schema
const formSchema = z.object({
    title: z.string().min(1, 'Task cannot be empty').max(50, 'Task cannot be longer than 50 characters'),
})

type FormData = z.infer<typeof formSchema>

interface AddTodoFormProps {
    onAdd: (title: string) => Promise<void>
}

export default function AddTodoForm({ onAdd }: AddTodoFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
        },
    })

    async function onSubmit(data: FormData) {
        setIsLoading(true);
        try {
            await onAdd(data.title);
            form.reset();
        } catch (error) {
            console.error('Failed to add todo:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input
                                    placeholder="Add a new task..."
                                    {...field}
                                    disabled={isLoading}
                                    className="bg-white/50"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Task</span>
                </Button>
            </form>
        </Form>
    )
}

