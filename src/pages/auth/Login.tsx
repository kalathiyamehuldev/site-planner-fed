import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";
import { LoginDto } from "@/common/types/auth.types";
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
import { Eye, EyeOff, Mail, Key, User } from "lucide-react";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginType, setLoginType] = React.useState<"admin" | "team">("admin");

  const form = useForm<LoginDto>({
    defaultValues: {
      email: "",
      password: "",
      accountId: "",
      role: "root",
    },
  });

  const onSubmit = async (data: LoginDto) => {
    // Set role based on login type
    data.role = loginType === "admin" ? "root" : "team_member";

    // For dummy implementation, just navigate to home
    // Later this will call the actual login API
    console.log("Login data:", data);
    localStorage.setItem("token", "1234567890");
    navigate("/");

    // Uncomment when ready to implement actual login
    // const result = await dispatch(login(data));
    // if (login.fulfilled.match(result)) {
    //   navigate('/');
    // }
  };

  const handleLoginTypeSwitch = (type: "admin" | "team") => {
    setLoginType(type);
    // Reset form when switching
    form.reset({
      email: "",
      password: "",
      accountId: "",
      role: type === "admin" ? "root" : "team_member",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {loginType === "admin" ? "Admin Login" : "Team Login"}
          </CardTitle>
          <CardDescription>
            {loginType === "admin"
              ? "Sign in to your admin account"
              : "Sign in to your team member account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {loginType === "team" && (
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your account ID"
                            {...field}
                          />
                          <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {loginType === "admin" && (
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          )}

          <div className="text-sm text-gray-500">
            {loginType === "admin" ? (
              <button
                type="button"
                onClick={() => handleLoginTypeSwitch("team")}
                className="text-primary hover:underline cursor-pointer"
              >
                Team Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleLoginTypeSwitch("admin")}
                className="text-primary hover:underline cursor-pointer"
              >
                Admin Login
              </button>
            )}
          </div>

          {loginType === "admin" && (
            <div className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
