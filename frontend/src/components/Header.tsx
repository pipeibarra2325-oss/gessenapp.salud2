import { Heart, Menu, User, UserPlus, LogOut, Settings, UserCircle, Info } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from './ui/sheet';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SettingsModal } from './SettingsModal';
import { EditarPerfilModal } from './EditarPerfilModal';
// Usa gráficas: se descarga solo cuando se abre
const AboutMeModal = lazy(() => import('./AboutMeModal').then((m) => ({ default: m.AboutMeModal })));
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn: boolean;
  user: any;
  onLogout: () => void;
  onLogin: (userData: any) => void;
}

export function Header({ isLoggedIn, user, onLogout, onLogin }: HeaderProps) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [olvidoOpen, setOlvidoOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [aboutMeModalOpen, setAboutMeModalOpen] = useState(false);

  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-green-700 font-bold">GessenApp</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Salud y Nutrición</p>
              </div>
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#recetas" className="text-sm font-medium text-foreground hover:text-green-600 transition-colors">
                Recetas
              </a>
              <a href="#consejos" className="text-sm font-medium text-foreground hover:text-green-600 transition-colors">
                Consejos
              </a>
              <a href="#sobre-diabetes" className="text-sm font-medium text-foreground hover:text-green-600 transition-colors">
                Sobre Diabetes
              </a>

              <div className="flex items-center gap-3 ml-4 min-w-[200px] justify-end">
                <AnimatePresence mode="wait">
                  {!isLoggedIn ? (
                    <motion.div
                      key="logged-out"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-2"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-700 hover:text-green-800 hover:bg-green-50"
                        onClick={handleSwitchToRegister}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Registrarse
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800 text-white shadow-md shadow-green-100"
                        onClick={handleSwitchToLogin}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Iniciar Sesión
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="logged-in"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" aria-label="Menú de la cuenta" className="relative h-10 w-10 rounded-full border border-green-100 p-0 hover:bg-green-50 shadow-sm ring-2 ring-green-50 ring-offset-2 overflow-hidden group">
                            <div className="bg-green-600 w-full h-full flex items-center justify-center group-hover:bg-green-700 transition-colors">
                              <span className="text-white font-bold text-sm">
                                {user?.name?.[0] || 'U'}
                              </span>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-bold leading-none">
                                {user?.name} {user?.lastName}
                              </p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setAboutMeModalOpen(true)}>
                            <Info className="mr-2 h-4 w-4" />
                            Sobre Mí
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSettingsModalOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configuración
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                            onClick={onLogout}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Menú Móvil */}
            <div className="flex items-center gap-2 lg:hidden">
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Menú de la cuenta" className="rounded-full bg-green-50">
                      <UserCircle className="h-6 w-6 text-green-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold">{user?.name} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAboutMeModalOpen(true)}>
                      <Info className="mr-2 h-4 w-4" /> Sobre Mí
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSettingsModalOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" /> Configuración
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle className="text-left flex items-center gap-2">
                      <Heart className="h-5 w-5 text-green-600" />
                      GessenApp
                    </SheetTitle>
                    <SheetDescription className="text-left">
                      Menú de navegación
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-4 mt-8">
                    <a href="#recetas" className="text-lg font-medium">Recetas</a>
                    <a href="#consejos" className="text-lg font-medium">Consejos</a>
                    <a href="#sobre-diabetes" className="text-lg font-medium">Sobre Diabetes</a>

                    <div className="pt-6 border-t flex flex-col gap-3">
                      {!isLoggedIn ? (
                        <>
                          <Button variant="outline" onClick={handleSwitchToRegister}>Registrarse</Button>
                          <Button className="bg-green-700" onClick={handleSwitchToLogin}>Iniciar Sesión</Button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Button variant="ghost" className="w-full justify-start" onClick={() => setAboutMeModalOpen(true)}>
                            <Info className="h-4 w-4 mr-2" /> Sobre Mí
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => setSettingsModalOpen(true)}>
                            <Settings className="h-4 w-4 mr-2" /> Configuración
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-red-600" onClick={onLogout}>
                            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                          </Button>
                        </div>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Modales */}
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        onSwitchToRegister={handleSwitchToRegister} 
        onSwitchToForgotPassword={() => { setLoginModalOpen(false); setOlvidoOpen(true); }}
        onLoginSuccess={onLogin} 
      />
      <ForgotPasswordModal
        open={olvidoOpen}
        onClose={() => setOlvidoOpen(false)}
        onBackToLogin={() => { setOlvidoOpen(false); setLoginModalOpen(true); }}
      />
      <RegisterModal 
        open={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)} 
        onSwitchToLogin={handleSwitchToLogin} 
        onRegisterSuccess={onLogin} 
      />
      {aboutMeModalOpen && (
      <Suspense fallback={null}>
      <AboutMeModal 
        open={aboutMeModalOpen} 
        onClose={() => setAboutMeModalOpen(false)} 
        user={user} 
        onEdit={() => {
          // Abre el formulario de edición del perfil (antes abría el de registro)
          setAboutMeModalOpen(false);
          setEditarPerfilOpen(true);
        }}
        isLoggedIn={isLoggedIn} 
        region={null} 
      />
      </Suspense>
      )}
      <EditarPerfilModal
        open={editarPerfilOpen}
        onClose={() => setEditarPerfilOpen(false)}
        user={user}
        onUpdateUser={onLogin}
      />
      <SettingsModal 
        open={settingsModalOpen} 
        onClose={() => setSettingsModalOpen(false)} 
        user={user} 
        onUpdateUser={onLogin} 
        onLogout={onLogout} 
      />
    </>
  );
}