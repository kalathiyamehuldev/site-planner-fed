
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { forgotPassword } from '@/redux/slices/authSlice';
import { ForgotPasswordDto } from '@/common/types/auth.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const [role, setRole] = React.useState<'root' | 'team_member'>('team_member');

  const form = useForm<ForgotPasswordDto>({
    defaultValues: {
      email: '',
      role: 'team_member'
    }
  });

  const onSubmit = async (data: ForgotPasswordDto) => {
    data.role = role;
    await dispatch(forgotPassword(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your {role === 'root' ? 'admin' : 'team member'} password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex rounded-lg overflow-hidden">
            <Button
              type="button"
              variant={role === 'team_member' ? 'default' : 'outline'}
              className="flex-1 rounded-none"
              onClick={() => setRole('team_member')}
            >
              Team Member
            </Button>
            <Button
              type="button"
              variant={role === 'root' ? 'default' : 'outline'}
              className="flex-1 rounded-none"
              onClick={() => setRole('root')}
            >
              Admin
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your email"
                          type="email"
                          {...field}
                        />
                        <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Send Reset Instructions
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-500">
            Remember your password?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
