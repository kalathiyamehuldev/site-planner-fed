import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { signup } from "@/redux/slices/authSlice";
import { SignupDto } from "@/common/types/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Eye, EyeOff, Mail, User, Key } from "lucide-react";

const Signup = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<SignupDto>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      accountId: "",
      role: "root", // Always admin for signup
    },
  });

  const onSubmit = async (data: SignupDto) => {
    // Always set role as root for admin signup
    data.role = "root";

    // For dummy implementation, just navigate to home
    // Later this will call the actual signup API
    console.log("Signup data:", data);
    navigate("/");

    // Uncomment when ready to implement actual signup
    // const result = await dispatch(signup(data));
    // if (signup.fulfilled.match(result)) {
    //   navigate('/');
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Admin Account</CardTitle>
          <CardDescription>Sign up as an admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter your first name" {...field} />
                        <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Enter your last name" {...field} />
                        <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter your password"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create Admin Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
