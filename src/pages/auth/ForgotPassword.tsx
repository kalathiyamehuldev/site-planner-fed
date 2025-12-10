
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, confirmForgotPassword } from '@/redux/slices/authSlice';
import { ForgotPasswordDto, ResetPasswordDto, UserType } from '@/common/types/auth.types';
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
import { Badge } from "@/components/ui/badge";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail } from 'lucide-react';

// Schemas
const requestSchema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  userType: yup.mixed<UserType>().oneOf(Object.values(UserType)).required('User type is required'),
});

const resetSchema = yup.object().shape({
  newPassword: yup
    .string()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
      'Must include lower, upper, number, special char; min 8')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [step, setStep] = React.useState<'request' | 'verify' | 'reset'>('request');
  const [userType, setUserType] = React.useState<UserType>(UserType.USER);
  const [email, setEmail] = React.useState('');
  const [otpDigits, setOtpDigits] = React.useState(['', '', '', '']);
  const [countdown, setCountdown] = React.useState(0);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const requestForm = useForm<ForgotPasswordDto>({
    resolver: yupResolver(requestSchema) as any,
    defaultValues: { email: '', userType: UserType.USER },
    mode: 'onChange',
  });

  const resetForm = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: yupResolver(resetSchema) as any,
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const handleRequestSubmit = async (data: ForgotPasswordDto) => {
    const result = await dispatch(sendForgotPasswordOtp({ email: data.email, userType }));
    if (sendForgotPasswordOtp.fulfilled.match(result)) {
      setEmail(data.email);
      setStep('verify');
      setCountdown(120);
    }
  };

  React.useEffect(() => {
    if (step !== 'verify') return;
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [step, countdown]);

  const otpRefs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const otp = otpDigits.join('');

  const handleVerify = async () => {
    if (otp.length !== 4 || isVerifying) return;
    setIsVerifying(true);
    const result = await dispatch(verifyForgotPasswordOtp({ email, otp, userType }));
    setIsVerifying(false);
    if (verifyForgotPasswordOtp.fulfilled.match(result)) {
      setStep('reset');
    }
  };

  React.useEffect(() => {
    if (step === 'verify' && otp.length === 4 && !isVerifying) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  const resendOtp = async () => {
    if (countdown > 0) return;
    const result = await dispatch(sendForgotPasswordOtp({ email, userType }));
    if (sendForgotPasswordOtp.fulfilled.match(result)) {
      setOtpDigits(['', '', '', '']);
      otpRefs[0].current?.focus();
      setCountdown(120);
    }
  };

  const handleResetSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    const payload: ResetPasswordDto = { email, otp, newPassword: values.newPassword, userType };
    const result = await dispatch(confirmForgotPassword(payload));
    if (confirmForgotPassword.fulfilled.match(result)) {
      navigate('/auth/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--neutral-200, #F5F7FA)' }}>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-6 text-center">
          <CardTitle className="font-bold text-2xl" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--neutral-900, #1F2933)' }}>
            Forgot Password
          </CardTitle>
          <CardDescription className="text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--neutral-600, #7B8794)' }}>
            {step === 'request' && 'Choose user type and send OTP'}
            {step === 'verify' && 'Enter the 4-digit OTP sent to your email'}
            {step === 'reset' && 'Set a new password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {step === 'request' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Badge
                  variant={userType === UserType.USER ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                    userType === UserType.USER
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    setUserType(UserType.USER);
                    requestForm.setValue('userType', UserType.USER);
                  }}
                >
                  Member
                </Badge>
                <Badge
                  variant={userType === UserType.CUSTOMER ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                    userType === UserType.CUSTOMER
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    setUserType(UserType.CUSTOMER);
                    requestForm.setValue('userType', UserType.CUSTOMER);
                  }}
                >
                  Customer
                </Badge>
                <Badge
                  variant={userType === UserType.VENDOR ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center ${
                    userType === UserType.VENDOR
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'border-2 border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    setUserType(UserType.VENDOR);
                    requestForm.setValue('userType', UserType.VENDOR);
                  }}
                >
                  Vendor
                </Badge>
              </div>

              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--neutral-700, #616E7C)' }}>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                              className="font-medium"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            />
                            <Mail className="absolute right-3 top-2.5 h-5 w-5" style={{ color: 'var(--neutral-500, #9AA5B1)' }} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="app-btn app-btn--primary app-btn--l w-full"
                    disabled={isLoading || !requestForm.formState.isValid}
                  >
                    Send OTP
                  </Button>
                </form>
              </Form>
            </>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="flex gap-3 justify-center">
                {otpDigits.map((d, i) => (
                  <Input
                    key={i}
                    ref={otpRefs[i]}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    maxLength={1}
                    className="w-14 text-center text-xl font-semibold"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      color: 'var(--neutral-900, #1F2933)',
                      borderColor: 'var(--neutral-300, #E4E7EB)',
                    }}
                  />
                ))}
              </div>
              <Button
                onClick={handleVerify}
                className="app-btn app-btn--primary app-btn--l w-full"
                disabled={isLoading || otp.length !== 4 || isVerifying}
              >
                Continue
              </Button>
              <div className="text-sm text-gray-600 text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={countdown > 0}
                  className={`hover:underline ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : ''}`}
                  style={{ color: countdown > 0 ? '#AFC8EB' : 'var(--brand-primary, #1B78F9)' }}
                >
                  Resend mail
                </button>
                {countdown > 0 && (
                  <span className="ml-2">{String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}</span>
                )}
              </div>
            </div>
          )}

          {step === 'reset' && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--neutral-700, #616E7C)' }}>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                          className="font-medium"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--neutral-700, #616E7C)' }}>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                          className="font-medium"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="app-btn app-btn--primary app-btn--l w-full"
                  disabled={isLoading || !resetForm.formState.isValid}
                >
                  Reset Password
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="pb-6 text-center justify-center">
          <div className="text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--neutral-600, #7B8794)' }}>
            Remember your password?{' '}
            <Link to="/auth/login" className="hover:underline" style={{ color: 'var(--brand-primary, #1B78F9)' }}>
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ForgotPassword;
