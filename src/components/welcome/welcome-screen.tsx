'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import AuthOptions from '@/components/auth/AuthOptions'
import { CheckCircle2, Users, Calendar, Trophy } from 'lucide-react'

const features = [
  {
    icon: CheckCircle2,
    title: 'Task Management',
    description: 'Create and manage your daily tasks with ease'
  },
  {
    icon: Users,
    title: 'Social Features',
    description: 'Connect with friends and see who\'s online'
  },
  {
    icon: Calendar,
    title: 'Daily Goals',
    description: 'Set and achieve your daily objectives'
  },
  {
    icon: Trophy,
    title: 'Point System',
    description: 'Earn points and compete on the leaderboard'
  }
]

export function WelcomeScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-4xl mx-auto py-12 px-4"
    >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to ProcrastiMATE
        </h1>
        <p className="text-xl text-muted-foreground">
          A todo list platform where you can compare your productivity with your friends
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 space-y-2">
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AuthOptions />
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
} 