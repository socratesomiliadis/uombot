import Header from "@/components/homepage/header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/chat");
  }

  const suggestions = [
    "Where is the library?",
    "When do exams start?",
    "Bus schedules",
    "Erasmus application",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-12">
        {/* Hero Section */}
        <div className="w-full max-w-3xl text-center space-y-8 mt-10 md:mt-20">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Your Intelligent <br className="hidden md:block" />
              <span className="text-blue-600 dark:text-blue-400">
                University Companion
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ask anything about academic life, courses, admissions, and campus
              services at the University of Macedonia.
            </p>
          </div>

          {/* Fake Chat Input */}
          <div className="w-full max-w-2xl mx-auto relative group cursor-text">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Link
              href="/sign-in"
              className="relative flex items-center gap-3 w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-4 shadow-lg transition-all duration-200 text-left"
            >
              <Search className="w-6 h-6 text-muted-foreground" />
              <span className="text-lg text-muted-foreground">
                Ask UOMBot anything...
              </span>
              <div className="ml-auto bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </Link>
          </div>

          {/* Suggestion Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion}
                href="/sign-in"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 rounded-full transition-colors duration-200"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-5xl mx-auto mt-24 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Academic Info</h3>
              <p className="text-muted-foreground text-sm">
                Instant access to course details, schedules, and degree
                requirements directly from university handbooks.
              </p>
            </div>

            <div className="group p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Campus Services</h3>
              <p className="text-muted-foreground text-sm">
                Find library hours, administrative offices, student support
                services, and campus facilities easily.
              </p>
            </div>

            <div className="group p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Powered</h3>
              <p className="text-muted-foreground text-sm">
                Advanced language models understand your questions in Greek and
                English, providing accurate and contextual answers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} University of Macedonia. All rights
            reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="https://www.uom.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              University Website
            </a>
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
