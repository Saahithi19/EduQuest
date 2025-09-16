"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { UserManagement } from "./user-management"
import { ContentModerationPanel } from "./content-moderation"
import { SystemAnalytics } from "./system-analytics"
import { SystemSettingsPanel } from "./system-settings"
import { AdminService } from "@/lib/admin"
import type { User } from "@/types/user"
import type { SystemUser, SystemSettings } from "@/types/admin"
import { Users, Shield, BarChart3, Settings, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AdminDashboardProps {
  user: User
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const adminService = AdminService.getInstance()
  const [systemUsers, setSystemUsers] = useState(adminService.getSystemUsers())
  const [pendingContent, setPendingContent] = useState(adminService.getPendingContent())
  const [systemSettings, setSystemSettings] = useState(adminService.getSystemSettings())
  const stats = adminService.getSystemStats()
  const analytics = adminService.getPlatformAnalytics()

  const handleUserUpdated = async (updatedUser: SystemUser) => {
    try {
      const result = await adminService.updateUser(updatedUser.id, updatedUser)
      setSystemUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? result : u)))
      toast({
        title: "User updated",
        description: `${updatedUser.name} has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUserDeleted = async (userId: string) => {
    const user = systemUsers.find((u) => u.id === userId)
    if (!user) return

    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        await adminService.deleteUser(userId)
        setSystemUsers((prev) => prev.filter((u) => u.id !== userId))
        toast({
          title: "User deleted",
          description: `${user.name} has been removed from the system.`,
        })
      } catch (error) {
        toast({
          title: "Deletion failed",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleUserCreated = async (newUser: SystemUser) => {
    try {
      const result = await adminService.createUser(newUser)
      setSystemUsers((prev) => [result, ...prev])
      toast({
        title: "User created",
        description: `${newUser.name} has been added to the system.`,
      })
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleContentModerated = async (contentId: string, status: "approved" | "rejected", reviewNotes?: string) => {
    try {
      const result = await adminService.moderateContent(contentId, status, reviewNotes)
      setPendingContent((prev) => prev.map((c) => (c.contentId === contentId ? result : c)))
      toast({
        title: `Content ${status}`,
        description: `The content has been ${status} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Moderation failed",
        description: "Failed to moderate content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSettingsUpdated = async (updatedSettings: SystemSettings) => {
    try {
      const result = await adminService.updateSystemSettings(updatedSettings)
      setSystemSettings(result)
      toast({
        title: "Settings updated",
        description: "System settings have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const pendingModerationCount = pendingContent.filter((item) => item.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">Admin Dashboard 🛡️</h2>
              <p className="text-muted-foreground mt-1">
                Manage users, moderate content, and configure system settings.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
              <p className="text-sm text-muted-foreground">{user.school}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {(systemSettings.maintenanceMode || pendingModerationCount > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">System Alerts</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-orange-700">
              {systemSettings.maintenanceMode && <p>• Maintenance mode is currently enabled</p>}
              {pendingModerationCount > 0 && <p>• {pendingModerationCount} content items pending moderation</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Admin Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2 relative">
            <Shield className="h-4 w-4" />
            Moderation
            {pendingModerationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingModerationCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SystemAnalytics stats={stats} analytics={analytics} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement
            users={systemUsers}
            onUserUpdated={handleUserUpdated}
            onUserDeleted={handleUserDeleted}
            onUserCreated={handleUserCreated}
          />
        </TabsContent>

        <TabsContent value="moderation">
          <ContentModerationPanel pendingContent={pendingContent} onContentModerated={handleContentModerated} />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsPanel settings={systemSettings} onSettingsUpdated={handleSettingsUpdated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
