import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { registerCompany } from "@/redux/slices/authSlice";
import { CreateCompanyDto } from "@/common/types/auth.types";
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
import { Mail, User, Building, Phone, MapPin, Check, X } from "lucide-react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

// Password validation rules
const passwordRules = [
  { id: 'length', label: '8 characters or more', test: (password: string) => password.length >= 8 },
  { id: 'lowercase', label: '1 lowercase character', test: (password: string) => /[a-z]/.test(password) },
  { id: 'uppercase', label: '1 uppercase character', test: (password: string) => /[A-Z]/.test(password) },
  { id: 'number', label: '1 number', test: (password: string) => /\d/.test(password) },
  { id: 'special', label: '1 special character', test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password) },
];

// Validation schema
const signupSchema = yup.object().shape({
  // Company details
  name: yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters")
    .required("Company name is required"),
  email: yup.string()
    .email("Please enter a valid email address")
    .required("Company email is required"),
  phone: yup.string().optional(),
  address: yup.string().optional(),
  // Super admin details
  firstName: yup.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .required("First name is required"),
  lastName: yup.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .required("Last name is required"),
  password: yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
    .required("Password is required"),
});

const Signup = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const form = useForm<CreateCompanyDto>({
    resolver: yupResolver(signupSchema) as any,
    mode: "onChange",
    defaultValues: {
      // Company details
      name: "",
      email: "",
      phone: "",
      address: "",
      // Super admin details
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  const { isValid, errors } = form.formState;
  const watchedPassword = form.watch("password");

  const onSubmit = async (data: CreateCompanyDto) => {
    const result = await dispatch(registerCompany(data));
    if (registerCompany.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Register Your Company
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Create your company account and admin user to get started
            </CardDescription>
          </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Company Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-x-2 pb-3 border-b-2 border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Company Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          Company Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input 
                              placeholder="Enter company name" 
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.name 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              style={{ paddingRight: '48px' }}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <Building className="h-5 w-5 text-gray-400" />
                            </div>
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
                          Company Email
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input
                              placeholder="Enter company email"
                              type="email"
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.email 
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Company Phone (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input 
                              placeholder="Enter company phone" 
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.phone 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              style={{ paddingRight: '48px' }}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-gray-700">Company Address (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input 
                              placeholder="Enter company address" 
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.address 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              style={{ paddingRight: '48px' }}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Admin User Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-x-2 pb-3 border-b-2 border-green-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Admin User Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          First Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input 
                              placeholder="Enter your first name" 
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.firstName 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              style={{ paddingRight: '48px' }}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          Last Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input 
                              placeholder="Enter your last name" 
                              {...field}
                              className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                                errors.lastName 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              style={{ paddingRight: '48px' }}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

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
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            className={`pl-4 pr-4 py-3 text-base transition-all duration-200 flex-1 ${
                              errors.password 
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
                      
                      {/* Password Validation Indicators */}
                      {(passwordFocused || watchedPassword) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <p className="text-xs font-medium text-gray-700 mb-3">Password must contain:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {passwordRules.map((rule) => {
                              const isValid = watchedPassword ? rule.test(watchedPassword) : false;
                              const isEmpty = !watchedPassword;
                              
                              return (
                                <div key={rule.id} className="flex items-center gap-2">
                                  <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                    isEmpty 
                                      ? 'border-gray-300 bg-white' 
                                      : isValid 
                                        ? 'border-green-500 bg-green-500' 
                                        : 'border-red-500 bg-red-500'
                                  }`}>
                                    {!isEmpty && (
                                      isValid ? (
                                        <Check className="w-2.5 h-2.5 text-white" />
                                      ) : (
                                        <X className="w-2.5 h-2.5 text-white" />
                                      )
                                    )}
                                  </div>
                                  <span className={`text-xs transition-colors duration-200 ${
                                    isEmpty 
                                      ? 'text-gray-500' 
                                      : isValid 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                  }`}>
                                    {rule.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <ActionButton 
                variant="primary"
                motion="subtle"
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={isLoading || !isValid}
                text={isLoading ? "Creating Company..." : "Register Company"}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center pb-8">
          <div className="w-full text-base text-gray-600">
            Already have a company account?{" "}
            <Link 
              to="/auth/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
};

export default Signup;
