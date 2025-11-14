
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { forgotPassword } from '@/redux/slices/authSlice';
import { ForgotPasswordDto, UserType } from '@/common/types/auth.types';
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
  const [userType, setUserType] = React.useState<UserType>(UserType.USER);

  const form = useForm<ForgotPasswordDto>({
    defaultValues: {
      email: '',
      
    }
  });

  const onSubmit = async (data: ForgotPasswordDto) => {
    await dispatch(forgotPassword(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your {userType === 'USER' ? 'user' : userType.toLowerCase()} password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-3 gap-2">
            <Button type="button" variant={userType === UserType.USER ? 'default' : 'outline'} onClick={() => setUserType(UserType.USER)}>User</Button>
            <Button type="button" variant={userType === UserType.CUSTOMER ? 'default' : 'outline'} onClick={() => setUserType(UserType.CUSTOMER)}>Customer</Button>
            <Button type="button" variant={userType === UserType.VENDOR ? 'default' : 'outline'} onClick={() => setUserType(UserType.VENDOR)}>Vendor</Button>
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
