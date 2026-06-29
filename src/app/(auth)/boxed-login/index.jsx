import authBgDark from '@/assets/images/auth-bg-dark.jpg';
import authBg from '@/assets/images/auth-bg.jpg';
import ArabianFlag from '@/assets/images/flags/arebian.svg';
import FrenchFlag from '@/assets/images/flags/french.jpg';
import GermanyFlag from '@/assets/images/flags/germany.jpg';
import ItalyFlag from '@/assets/images/flags/italy.jpg';
import JapaneseFlag from '@/assets/images/flags/japanese.svg';
import RussiaFlag from '@/assets/images/flags/russia.jpg';
import SpainFlag from '@/assets/images/flags/spain.jpg';
import UsFlag from '@/assets/images/flags/us.jpg';
import LogoDark from '@/assets/images/logo-dark.png';
import LogoLight from '@/assets/images/logo-light.png';
import TpLogoDark from '@/assets/images/TRAVELPORT_LOGO_BLACK_CMYK.png';
import TpLogoLight from '@/assets/images/TRAVELPORT_LOGO_SAND_CMYK.png';
import Boxed from '@/assets/images/boxed.png';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import { hrApi } from '@/services/hrApi';
import { getAuthSession, saveAuthSession } from '@/utils/auth';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useNavigate } from 'react-router-dom';
import PageMeta from '@/components/PageMeta';
const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (session.token) {
      navigate(session.dashboardRoute, { replace: true });
    }
  }, [navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await hrApi.login({ email, password });
      saveAuthSession(response);
      const session = getAuthSession();
      navigate(session.dashboardRoute || '/dashboard', { replace: true });
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <>
      <PageMeta title="Login" />
      <div className="h-screen w-full flex justify-center items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="block dark:hidden h-full w-full">
            <img src={authBg} alt="background" className="object-cover w-full h-full" />
          </div>
          <div className="hidden dark:block h-full w-full">
            <img src={authBgDark} alt="background dark" className="object-cover w-full h-full" />
          </div>
        </div>
        <div className="relative dark:bg-[url('../images/auth-bg-dark.jpg')] max-h-[95vh] overflow-y-auto">
          <div className="bg-card/70 rounded-lg w-2/3 mx-auto">
            <div className="grid lg:grid-cols-12 grid-cols-1 items-center gap-0">
              <div className="lg:col-span-5">
                <div className="text-center px-10 py-12">
                  <h4 className="mb-3 text-xl font-semibold text-purple-500">Welcome Back !</h4>
                  <p className="text-base text-default-500">Sign in to continue to HR Portal.</p>

                  <form onSubmit={handleLogin} className="text-left w-full mt-10">
                    <div className="mb-4">
                      <label htmlFor="Username" className="block font-medium text-default-900 text-sm mb-2">
                        Username/ Email ID
                      </label>
                      <input type="text" id="Username" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="Enter Username or email" />
                    </div>

                    <div className="mb-4">
                      <Link to="/boxed-reset-password" className="text-primary font-medium text-sm mb-2 float-end">
                        Forgot Password ?
                      </Link>
                      <label htmlFor="Password" className="block font-medium text-default-900 text-sm mb-2">
                        Password
                      </label>
                      <input type="password" id="Password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="Enter Password" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input id="checkbox-1" type="checkbox" className="form-checkbox" />
                      <label htmlFor="checkbox-1" className="text-default-900 text-sm font-medium">
                        Remember Me
                      </label>
                    </div>

                    <div className="mt-10 text-center">
                      <button type="submit" disabled={isSubmitting} className="btn bg-primary text-white w-full disabled:opacity-60">
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                      </button>
                    </div>

                    
                  </form>
                </div>
              </div>

              <div className="lg:col-span-7 bg-card/60 mx-2 my-2 shadow-[0_14px_15px_-3px_#f1f5f9,0_4px_6px_-4px_#f1f5f9] dark:shadow-none rounded-lg">
                <div className="pt-10 px-10 h-full">
                  <div className="flex items-center justify-between gap-3">
                    <Link to="/index">
                      <img src={TpLogoDark} alt="logo dark" className="h-6 block dark:hidden" />
                      <img src={TpLogoLight} alt="logo light" className="h-6 hidden dark:block" />
                    </Link>

                    <div className="hs-dropdown [--placement:bottom-right] relative inline-flex">
                      <button type="button" className="hs-dropdown-toggle py-2 px-4 bg-transparent border border-default-200 text-default-600 hover:border-primary rounded-md hover:text-primary font-medium text-sm gap-2 flex items-center">
                        <img src={UsFlag} alt="US Flag" className="size-5 rounded-full" />
                        English
                      </button>

                      <div className="hs-dropdown-menu">
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={UsFlag} alt="US Flag" className="size-4 rounded-full" />
                          English
                        </Link>
                        {/* <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={SpainFlag} alt="Spain Flag" className="size-4 rounded-full" />
                          Spanish
                        </Link>
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={GermanyFlag} alt="Germany Flag" className="size-4 rounded-full" />
                          German
                        </Link> */}
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={FrenchFlag} alt="French Flag" className="size-4 rounded-full" />
                          French
                        </Link>
                        {/* <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={JapaneseFlag} alt="Japanese Flag" className="size-4 rounded-full" />
                          Japanese
                        </Link>
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={ItalyFlag} alt="Italy Flag" className="size-4 rounded-full" />
                          Italian
                        </Link>
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={RussiaFlag} alt="Russia Flag" className="size-4 rounded-full" />
                          Russian
                        </Link> */}
                        <Link to="" className="flex items-center gap-x-3.5 py-1.5 font-medium px-3 text-default-600 hover:bg-default-150 rounded">
                          <img src={ArabianFlag} alt="Arabic Flag" className="size-4 rounded-full" />
                          Arabic
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <img src={Boxed} alt="Boxed Illustration" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>;
};
export default Index;