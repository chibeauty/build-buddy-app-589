import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, BookOpen, Video, HelpCircle, Search } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create my first study plan?",
          a: "Navigate to the Study Plans section from the bottom navigation, click 'Create New Plan', and fill in your subject, goals, and available study time. Our AI will generate a personalized study schedule for you."
        },
        {
          q: "What are AI credits and how do I use them?",
          a: "AI credits are used for AI-powered features like quiz generation, content summarization, and flashcard creation. Each AI operation consumes credits. You start with 50 free credits and can purchase more or subscribe to a plan for unlimited credits."
        },
        {
          q: "How does the learning style assessment work?",
          a: "During onboarding, you'll answer questions about your learning preferences. The app uses this to personalize content delivery—visual learners get more diagrams, auditory learners get explanations, and kinesthetic learners get interactive exercises."
        }
      ]
    },
    {
      category: "Study Features",
      questions: [
        {
          q: "How do I generate a quiz from my study materials?",
          a: "Go to Quizzes → Generate Quiz, then upload a PDF, paste text, or select a topic. Choose your difficulty level and question count, then click Generate. The AI will create a custom quiz based on your content."
        },
        {
          q: "What is spaced repetition in flashcards?",
          a: "Spaced repetition is a learning technique where flashcards are shown at increasing intervals based on how well you know them. Cards you struggle with appear more frequently, while mastered cards appear less often, optimizing your study efficiency."
        },
        {
          q: "Can I share my study materials with friends?",
          a: "Yes! You can make your quizzes, flashcard decks, and study plans public. Other users can then find and use them in the Community section. You can also join study groups to collaborate with peers."
        }
      ]
    },
    {
      category: "Gamification & Rewards",
      questions: [
        {
          q: "How do I earn XP and level up?",
          a: "You earn XP by completing study activities: taking quizzes, reviewing flashcards, finishing study sessions, and maintaining your study streak. Higher difficulty activities award more XP."
        },
        {
          q: "What are achievements and how do I unlock them?",
          a: "Achievements are badges you earn for reaching milestones like maintaining study streaks, completing quizzes, or creating content. Check your Profile → Achievements to see available badges and your progress."
        },
        {
          q: "How does the referral program work?",
          a: "Share your unique referral link with friends. When they sign up and subscribe to a paid plan, you both receive 100 AI credits as a reward. There's no limit to how many people you can refer!"
        }
      ]
    },
    {
      category: "Subscription & Billing",
      questions: [
        {
          q: "What's included in the free plan?",
          a: "The free plan includes 50 AI credits, basic study plans, limited quiz generation, and flashcard creation. You can create up to 5 study plans and join public study groups."
        },
        {
          q: "How do I upgrade my subscription?",
          a: "Click the Upgrade button in the top navigation or visit Settings → Subscription Plans. Choose a plan that fits your needs and complete the payment process. Your new features will be available immediately."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel anytime from Settings → Manage Subscription. You'll retain access to premium features until the end of your current billing period, and your data will be preserved."
        }
      ]
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          q: "My AI credits aren't updating after purchase",
          a: "Credits usually update within a few seconds. If they don't appear, try refreshing the page. If the issue persists, contact support with your transaction reference number."
        },
        {
          q: "I'm not receiving study reminder notifications",
          a: "Check Settings → Notifications to ensure study reminders are enabled. Also verify your browser/device notification settings allow notifications from ExHub."
        },
        {
          q: "My study streak reset even though I studied",
          a: "Study streaks require activity in your study plans, quizzes, or flashcards. Ensure you're marking sessions as complete. If you believe this is an error, contact support with the date range."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchQuery === "" || 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Getting Started Guide</CardTitle>
                  <CardDescription className="text-sm">Learn the basics</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Video Tutorials</CardTitle>
                  <CardDescription className="text-sm">Watch how-to videos</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Community Forum</CardTitle>
                  <CardDescription className="text-sm">Ask the community</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* FAQ Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Find answers to the most common questions</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{category.category}</h3>
                    {category.questions.map((faq, faqIndex) => (
                      <AccordionItem key={`${categoryIndex}-${faqIndex}`} value={`${categoryIndex}-${faqIndex}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Still need help?</CardTitle>
            <CardDescription>Contact our support team and we'll get back to you within 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Email</label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea 
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button type="button" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
