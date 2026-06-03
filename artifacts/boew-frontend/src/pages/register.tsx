import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken, user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const registerMutation = useRegister();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setAuthToken(data.token);
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "REGISTRATION_FAILED",
          description: (err.data as { error?: string })?.error || "Error registering operative",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-mono text-sm relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5" 
           style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="w-full max-w-md p-8 border border-border bg-card relative z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
          <Terminal className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-widest text-primary">BOEW_SYS // REGISTER</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-widest text-xs">OPERATIVE_NAME (NAME)</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono bg-background border-border text-primary rounded-none focus-visible:ring-primary" placeholder="Enter name..." />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-widest text-xs">OPERATIVE_ID (EMAIL)</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono bg-background border-border text-primary rounded-none focus-visible:ring-primary" placeholder="Enter email address..." />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-widest text-xs">ACCESS_CODE (PASSWORD)</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="font-mono bg-background border-border text-primary rounded-none focus-visible:ring-primary" placeholder="Create password (min 6 chars)..." />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            
            <div className="pt-4 flex flex-col gap-4">
              <Button type="submit" disabled={registerMutation.isPending} className="w-full rounded-none font-bold tracking-widest uppercase group relative overflow-hidden">
                <span className="relative z-10">{registerMutation.isPending ? "PROCESSING..." : "REQUEST_ACCESS"}</span>
                <div className="absolute inset-0 bg-primary/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                ALREADY REGISTERED? <Link href="/login" className="text-primary hover:underline">INITIATE_SESSION</Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
