"use client"

import { useState } from "react"
import { GamificationStats } from "./gamification-stats"
import { SubjectProgress } from "./subject-progress"
import { LessonCard } from "./lesson-card"
import { CommunityQuest } from "./community-quest"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GamificationService } from "@/lib/gamification"
import { enhancedOfflineService } from "@/lib/enhanced-offline-service"
import { useNavigation } from "@/hooks/use-navigation"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types/user"
import { BookOpen, Trophy, Target, Zap, Download, Wifi, WifiOff, Play } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useOfflineStatus } from "@/hooks/use-offline"

interface StudentDashboardProps {
  user: User
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [downloadingLessons, setDownloadingLessons] = useState<Set<string>>(new Set())
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const { t } = useTranslation()
  const isOffline = useOfflineStatus()
  const { navigateToLesson, navigateToQuiz, navigateToSubject } = useNavigation()
  const { toast } = useToast()

  const gamificationService = GamificationService.getInstance()
  const progress = gamificationService.getStudentProgress(user.id)
  const lessons = gamificationService.getLessons(selectedSubject || undefined)
  const leaderboard = gamificationService.getLeaderboard()

  const currentChallenge = {
    id: "weekly-physics-challenge",
    title: "Physics Mastery Week",
    description: "Join students worldwide to complete 1000 physics lessons this week!",
    targetScore: 10000,
    currentScore: 7250,
    participants: 1247,
    timeLeft: "2 days 14 hours",
    isJoined: false,
    rewards: {
      points: 500,
      badge: "Physics Champion",
    },
  }

  const handleStartLesson = (lessonId: string) => {
    navigateToLesson(lessonId)
    toast({
      title: "Starting Lesson",
      description: "Loading lesson content...",
    })
  }

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject)
    navigateToSubject(subject)
  }

  const handleDownloadLesson = async (lessonId: string) => {
    if (downloadingLessons.has(lessonId)) return

    setDownloadingLessons((prev) => new Set(prev).add(lessonId))
    setDownloadProgress((prev) => ({ ...prev, [lessonId]: 0 }))

    try {
      const success = await enhancedOfflineService.downloadLesson(lessonId, (progress) => {
        setDownloadProgress((prev) => ({ ...prev, [lessonId]: progress }))
      })

      if (success) {
        toast({
          title: "Download Complete",
          description: "Lesson is now available offline!",
        })
      } else {
        toast({
          title: "Download Failed",
          description: "Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download lesson materials.",
        variant: "destructive",
      })
    } finally {
      setDownloadingLessons((prev) => {
        const newSet = new Set(prev)
        newSet.delete(lessonId)
        return newSet
      })
      setDownloadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[lessonId]
        return newProgress
      })
    }
  }

  const handleDownloadSubject = async (subject: string) => {
    const subjectLessons = lessons.filter((lesson) => lesson.subject.toLowerCase() === subject.toLowerCase())

    toast({
      title: "Downloading Subject",
      description: `Starting download of ${subjectLessons.length} lessons...`,
    })

    for (const lesson of subjectLessons) {
      await handleDownloadLesson(lesson.id)
    }
  }

  const motivationalMessages = [
    t("gamification.keepGoing") + " You're making great progress! 🔥",
    "Every expert was once a beginner. " + t("gamification.excellent") + " 🌟",
    "Science is not only a discipline of reason but also one of romance and passion! 💫",
    "The important thing is not to stop questioning. Keep exploring! 🚀",
    t("gamification.amazing") + " Your dedication to learning is inspiring! ✨",
  ]

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

  return (
    <div className="space-y-6">
      {/* Offline Status Banner */}
      {isOffline && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">{t("offline.workingOffline")}</p>
                <p className="text-sm text-orange-600 dark:text-orange-300">{t("offline.dataWillSync")}</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {t("offline.offline")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                {t("common.welcome")} {user.name}! 👋
              </h2>
              <p className="text-muted-foreground mt-1">{randomMessage}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Grade {user.grade}</p>
              <p className="text-sm text-muted-foreground">{user.school}</p>
              <div className="flex items-center gap-1 mt-2">
                {isOffline ? (
                  <WifiOff className="h-4 w-4 text-orange-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isOffline ? t("offline.offline") : t("offline.online")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification Stats */}
      <GamificationStats progress={progress} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("learning.subjects")}
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t("learning.lessons")}
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t("learning.achievements")}
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {t("learning.communityQuest")}
          </TabsTrigger>
          <TabsTrigger value="offline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("offline.offlineMode")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <SubjectProgress progress={progress} onSubjectClick={handleSubjectClick} />
        </TabsContent>

        <TabsContent value="lessons">
          <div className="space-y-4">
            {selectedSubject && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedSubject} {t("learning.lessons")}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuiz(`${selectedSubject.toLowerCase()}-easy-1`)}
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Take Quiz
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedSubject(null)}>
                    Show All Subjects
                  </Button>
                </div>
              </div>
            )}

            {!selectedSubject && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Quizzes
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Test your knowledge with subject-specific quizzes</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {["Physics", "Chemistry", "Biology", "Mathematics"].map((subject) => (
                      <Button
                        key={subject}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                        onClick={() => navigateToQuiz(`${subject.toLowerCase()}-easy-1`)}
                      >
                        <div className="text-2xl">
                          {subject === "Physics" && "⚛️"}
                          {subject === "Chemistry" && "🧪"}
                          {subject === "Biology" && "🧬"}
                          {subject === "Mathematics" && "📐"}
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{subject} Quiz</p>
                          <p className="text-xs text-muted-foreground">Easy Level</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="relative">
                  <LessonCard lesson={lesson} onStartLesson={handleStartLesson} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                      onClick={() => handleDownloadLesson(lesson.id)}
                      disabled={downloadingLessons.has(lesson.id)}
                    >
                      {downloadingLessons.has(lesson.id) ? (
                        <>
                          <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                          {Math.round(downloadProgress[lesson.id] || 0)}%
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>{t("learning.badges")} Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {progress.badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="text-2xl">{badge.icon}</div>
                      <div>
                        <h4 className="font-medium">{badge.name}</h4>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        {badge.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned {badge.unlockedAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent {t("learning.achievements")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progress.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {achievement.completedAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">+{achievement.points}</p>
                        <p className="text-xs text-muted-foreground">{t("learning.points")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="community">
          <CommunityQuest entries={leaderboard} currentChallenge={currentChallenge} />
        </TabsContent>

        <TabsContent value="offline">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {t("offline.downloadForOffline")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download lessons and materials to access them without internet connection
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {["Physics", "Chemistry", "Biology", "Mathematics"].map((subject) => (
                    <Card key={subject} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{t(`learning.${subject.toLowerCase()}`)}</h3>
                        <Badge variant="outline">5 lessons</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Download all {subject.toLowerCase()} lessons and quizzes
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownloadSubject(subject)}
                        disabled={downloadingLessons.size > 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("common.download")} {subject}
                      </Button>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Downloaded Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Physics - Motion and Forces</h4>
                      <p className="text-sm text-muted-foreground">Downloaded 2 hours ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t("offline.offlineContentReady")}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleStartLesson("physics-motion")}>
                        <Play className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Chemistry - Atomic Structure</h4>
                      <p className="text-sm text-muted-foreground">Downloaded yesterday</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t("offline.offlineContentReady")}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleStartLesson("chemistry-atoms")}>
                        <Play className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
