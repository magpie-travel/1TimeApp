import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to 1time.ai</CardTitle>
          <CardDescription>Sign in to start preserving your memories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => console.log("Google sign-in")}>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => console.log("Apple sign-in")}>
            Continue with Apple
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}