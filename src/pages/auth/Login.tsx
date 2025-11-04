import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";
import { LoginDto, UserType } from "@/common/types/auth.types";
import ActionButton from "@/components/ui/ActionButton";
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
import { Mail, Users } from "lucide-react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

// Validation schema
const loginSchema = yup.object().shape({
  email: yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup.string()
    .min(1, "Password is required")
    .required("Password is required"),
  userType: yup.mixed<UserType>()
    .oneOf(Object.values(UserType))
    .required("User type is required"),
});

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, needsCompanySelection } = useAppSelector(
    (state) => state.auth
  );
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginDto>({
    resolver: yupResolver(loginSchema) as any,
    mode: "onChange",
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
    <div className="min-h-screen bg-[F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">
                        Select User Type
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          <Badge
                            variant={field.value === UserType.USER ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                              field.value === UserType.USER 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                                : "border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600"
                            }`}
                            onClick={() => field.onChange(UserType.USER)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Member
                          </Badge>
                          <Badge
                            variant={field.value === UserType.CUSTOMER ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                              field.value === UserType.CUSTOMER 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                                : "border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600"
                            }`}
                            onClick={() => field.onChange(UserType.CUSTOMER)}
                          >
                            Customer
                          </Badge>
                          <Badge
                            variant={field.value === UserType.VENDOR ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                              field.value === UserType.VENDOR 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                                : "border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600"
                            }`}
                            onClick={() => field.onChange(UserType.VENDOR)}
                          >
                            Vendor
                          </Badge>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        Email
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            {...field}
                            className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                              form.formState.errors.email 
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                            style={{ paddingRight: '48px' }}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        Password
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            {...field}
                            className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                              form.formState.errors.password 
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                            style={{ paddingRight: '48px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded p-1 transition-colors z-10"
                          >
                            {showPassword ? (
                              <RiEyeOffLine className="h-5 w-5 text-gray-400" />
                            ) : (
                              <RiEyeLine className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <ActionButton 
                  variant="primary" 
                  motion="subtle" 
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                  disabled={isLoading || !form.formState.isValid} 
                  text={isLoading ? "Signing In..." : "Sign In"} 
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center pb-8">
            <div className="space-y-4 mx-auto">
              <div className="text-sm text-gray-600">
                <Link
                  to="/auth/forgot-password"
                  className="text-gray-600 hover:text-blue-600 hover:underline transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="text-sm text-gray-600">
                Don't have a company account?{" "}
                <Link 
                  to="/auth/signup" 
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
                >
                  Register Company
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
