import React from 'react';
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { Card, CardContent } from "@/components/ui/card"; // Assuming shadcn/ui Card
import { Shield, MapPin, Bell, Smartphone, Users } from 'lucide-react'; // Assuming lucide-react for icons
import { useNavigate } from 'react-router-dom';

// Mock Navigation Component - simplified for homepage context
const Navigation = ({ navigate }) => {
  return (
    <nav className="bg-background border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-primary mr-2" />
          <span className="text-xl font-bold text-foreground">GuardianSense</span>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/login')}>Sign In</Button>
          <Button className="hover:bg-black text-white" onClick={() => navigate('/signup')}>Sign Up</Button>
        </div>
      </div>
    </nav>
  );
};

// The Homepage Component (originally named Index)
const HomePage = () => {
    const navigate = useNavigate();
    
  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Real-time Tracking",
      description: "Monitor your child's location with precise GPS tracking updated every few seconds."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Safety Zones",
      description: "Set up safe zones and get instant alerts when your child enters or leaves designated areas."
    },
    {
      icon: <Bell className="h-8 w-8 text-primary" />,
      title: "Instant Alerts",
      description: "Receive immediate notifications about your child's location, battery status, and safety."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Mobile App",
      description: "Access all features from your smartphone with our intuitive mobile application."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Tailwind CSS configuration - typically in index.css or a global style file */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          /* Custom Tailwind-like variables for colors and fonts */
          :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --ring: 221.2 83.2% 53.3%;
          }
          .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --primary: 217.2 91.2% 59.8%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --ring: 217.2 91.2% 59.8%;
          }

          /* Utility classes based on the above variables */
          .bg-background { background-color: hsl(var(--background)); }
          .text-foreground { color: hsl(var(--foreground)); }
          .text-muted-foreground { color: hsl(var(--muted-foreground)); }
          .bg-muted\\/30 { background-color: hsla(var(--muted), 0.3); }
          .bg-primary { background-color: hsl(var(--primary)); }
          .text-primary { color: hsl(var(--primary)); }
          .text-primary-foreground { color: hsl(var(--primary-foreground)); }
          .bg-primary\\/10 { background-color: hsla(var(--primary), 0.1); }
          .border-border { border-color: hsl(var(--border)); }
          .border-border\\/50 { border-color: hsla(var(--border), 0.5); }
          .bg-card { background-color: hsl(var(--card)); }
          .text-card-foreground { color: hsl(var(--card-foreground)); }
          .border-input { border-color: hsl(var(--input)); }
          .hover\\:bg-accent:hover { background-color: hsl(var(--accent)); }
          .hover\\:text-accent-foreground:hover { color: hsl(var(--accent-foreground)); }
          .shadow-soft { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .shadow-medium { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .shadow-large { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
          .hover\\:shadow-medium:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
          .bg-gradient-hero { background-image: linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--accent))); }
          .bg-gradient-card { background-image: linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--accent))); }
          .hover\\:bg-primary\\/90:hover { background-color: hsla(var(--primary), 0.9); }
          .bg-white\\/20 { background-color: rgba(255, 255, 255, 0.2); }
          .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
          .hover\\:bg-white\\/10:hover { background-color: rgba(255, 255, 255, 0.1); }
        `}
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
      <Navigation navigate={navigate} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Added a simple gradient for demonstration, can be customized */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              Real-time Child Safety Tracker
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Keep your children safe with GuardianSense - the most trusted real-time location tracking platform for modern families.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="xl" className="w-full p-3 sm:w-auto" onClick={() => navigate('signup')}>
                Get Started
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto p-3" onClick={() => navigate('login')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose GuardianSense?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive safety features designed with parents and children in mind.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-neutral-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Card className="shadow-xl bg-blue-400 text-white border-none">
            <CardContent className="p-8 sm:p-12">
              <div className="mb-6 flex justify-center">
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Keep Your Family Safe?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of families who trust GuardianSense to keep their children safe and connected.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="xl" className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 p-3" onClick={() => navigate('signup')}>
                  Start for Free
                </Button>
                <Button variant="outline" size="xl" className="w-full sm:w-auto border-white text-black p-3 hover:bg-white/10" onClick={() => navigate('login')}>
                  Existing User?
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold text-foreground">GuardianSense</span>
          </div>
          <p className="text-muted-foreground">
            Keeping families connected and children safe, everywhere they go.
          </p>
          <p className="text-muted-foreground text-sm mt-4">
            &copy; {new Date().getFullYear()} GuardianSense. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
