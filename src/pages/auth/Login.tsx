import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";
import { LoginDto, UserType } from "@/common/types/auth.types";
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
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Mail, Users } from "lucide-react";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, needsCompanySelection } = useAppSelector(
    (state) => state.auth
  );
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginDto>({
    defaultValues: {
      email: "",
      password: "",
      userType: UserType.USER,
    },
  });

  const onSubmit = async (data: LoginDto) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      if (!result.payload.needsCompanySelection) {
        navigate("/");
      }
      // If needsCompanySelection is true, the component will re-render and show company selection
    }
  };

  // Show company selection if needed
  if (needsCompanySelection) {
    // Import CompanySelection component
    const CompanySelection = React.lazy(
      () => import("@/components/auth/CompanySelection")
    );
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <CompanySelection />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Type</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={field.value === UserType.USER ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm"
                          onClick={() => field.onChange(UserType.USER)}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Member
                        </Badge>
                        <Badge
                          variant={field.value === UserType.CUSTOMER ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm"
                          onClick={() => field.onChange(UserType.CUSTOMER)}
                        >
                          Customer
                        </Badge>
                        <Badge
                          variant={field.value === UserType.VENDOR ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm"
                          onClick={() => field.onChange(UserType.VENDOR)}
                        >
                          Vendor
                        </Badge>
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>

          <div className="text-sm text-gray-500">
            Don't have a company account?{" "}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Register Company
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
