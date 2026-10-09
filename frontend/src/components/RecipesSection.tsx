import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { RecipeCard, type Recipe } from './RecipeCard';
import { MoreRecipesCard } from './MoreRecipesCard';
import { Button } from './ui/button';
import { Search, Sparkles, Activity, Star, Heart, Trash2, Utensils, Zap, ChefHat, ShoppingBag, Lightbulb, ChevronLeft, ChevronRight, Scan, BrainCircuit, HeartPulse } from 'lucide-react';
import { Input } from './ui/input';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SmartSearchTab } from './SmartSearchTab';
import { InventoryTab } from './InventoryTab';
import { DailyRecommendationsTab } from './DailyRecommendationsTab';
import { MLRecommendationsTab } from './MLRecommendationsTab';
import { ConsumptionTab, type Consumption } from './ConsumptionTab';
// El detalle de la receta y «Mi salud» usan gráficas: se descargan al abrirlos
const RecipeModal = lazy(() => import('./RecipeModal').then((m) => ({ default: m.RecipeModal })));
const SeguimientoClinico = lazy(() => import('./SeguimientoClinico').then((m) => ({ default: m.SeguimientoClinico })));
import { toast } from "sonner"
import { motion, AnimatePresence } from 'motion/react';
import { obtenerPlatillos, registrarConsumo, toggleFavorito, obtenerHistorialConsumos, eliminarConsumo, registrarInteraccion } from '../services/api';
import { calcularAlertas } from '../utils/referencias';
import { apiUrl, getAuthHeaders } from '../utils/auth';

const flavors = ['Todas', 'Dulce', 'Salado', 'Neutro'];
const categories = ['Todas', 'Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Snack', 'Postre'];
const preferences = ['Todas', 'Vegetariano', 'Con carne', 'Ligero', 'Tradicional'];


interface RecipesSectionProps {
  isLoggedIn: boolean;
  user: any;
  onLoginSuccess: (userData: any) => void;
}

export function RecipesSection({ isLoggedIn, user, onLoginSuccess }: RecipesSectionProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [errorRecipes, setErrorRecipes] = useState<string | null>(null);

  //const region = useMemo(() => user?.region || null, [user?.region]);

  const [selectedFlavor, setSelectedFlavor] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedPreference, setSelectedPreference] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTopRatedOnly, setShowTopRatedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSmartTab, setActiveSmartTab] = useState<string | null>(null);
  const [smartSearchFilteredRecipes, setSmartSearchFilteredRecipes] = useState<Recipe[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [historial, setHistorial] = useState<Consumption[]>([]);

  const recipesPerPage = 15;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  // Se incrementa tras registrar una calificación para recargar el catálogo (promedio de estrellas)
  const [versionCatalogo, setVersionCatalogo] = useState(0);
  const isUserLoggedIn = isLoggedIn && !!user?.id;

  // Cargar platillos desde la BD
  useEffect(() => {
    const loadPlatillos = async () => {
      try {
        if (versionCatalogo === 0) setIsLoadingRecipes(true);
        const data = await obtenerPlatillos();

        // Transformar datos de BD al formato que espera RecipeCard
        const formattedRecipes: Recipe[] = data.map((p: any) => ({
          id: p.id.toString(),
          title: p.title,
          description: p.description || '',
          image: p.image || 'https://placehold.co/400x300?text=Sin+imagen',
          imageCredit: p.imageCredit || null,
          prepTime: p.prepTime,
          servings: Number(p.servings) || 2,
          category: p.category || 'Almuerzo',
          flavor: p.flavors || [],
          preference: p.preferences || [],
          glycemicIndex: p.glycemicIndex,
          calories: p.calories || '0 kcal',
          carbs: p.carbs || '0g',
          protein: p.protein || '0g',
          fiber: p.fiber || '0g',
          fats: p.fats || '0g',
          sugars: p.sugars || '0g',
          sodium: p.sodium || '0mg',
          caloricLevel: p.caloricLevel || 'Medio',
          glycemicLoad: p.glycemicLoad || '0',
          macroDistribution: p.macroDistribution || { carbs: 50, protein: 25, fat: 25 },
          ingredients: p.ingredients || [],
          instructions: p.instructions || [],
          rating: p.rating ?? null,
          ratingCount: Number(p.ratingCount) || 0,
          isFavorite: false
        }));

        setRecipes(formattedRecipes);
      } catch (error) {
        console.error("Error cargando platillos:", error);
        setErrorRecipes("No se pudieron cargar las recetas. Inténtalo más tarde.");
        toast.error("Error al cargar las recetas");
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadPlatillos();
  }, [versionCatalogo]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isUserLoggedIn || !user?.id) return;

      try {
        const response = await fetch(apiUrl(`/platillos/favoritos/${user.id}`), { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Error al cargar favoritos');

        const favoritos = await response.json();
        // El backend devuelve los IDs como texto; se aceptan también objetos { id }
        const favIds = favoritos.map((f: any) => String(f?.id ?? f));
        setFavoriteIds(favIds);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      }
    };

    loadFavorites();
  }, [isUserLoggedIn, user?.id]);

  const handleFavoriteToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUserLoggedIn || !user?.id) {
      setLoginModalOpen(true);
      return;
    }

    try {
      const result = await toggleFavorito(user.id, parseInt(id));

      setFavoriteIds(prev =>
        result.isFavorite
          ? [...prev, id]
          : prev.filter(fid => fid !== id)
      );

      toast.success(result.message || "Favorito actualizado");
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      toast.error("Error al actualizar favorito");
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    if (isLoggedIn) {
      setSelectedRecipe(recipe);
      setRecipeModalOpen(true);
      // La vista del detalle alimenta el modelo de recomendación (señal débil de interés)
      registrarInteraccion(recipe.id).catch(() => {});
    } else {
      setLoginModalOpen(true);
    }
  };

  // Convierte un registro del backend al formato que usa la pestaña "Tus Consumos"
  const aConsumo = (r: any): Consumption => ({
    id: String(r.id_historial),
    recipeId: String(r.id_platillo),
    recipeName: r.nombre_platillo,
    mealTime: r.meal_time,
    date: r.fecha_consumo,
    time: r.hora || '',
    portions: Number(r.porcion_consumida) || 1,
    rating: r.rating_usuario ?? undefined,
    comment: r.comentario,
    glycemicIndex: (String(r.nivel_glucemico || 'bajo').toLowerCase() as 'bajo' | 'medio' | 'alto'),
    carbs: Number(r.carbs_consumidos) || 0,
    protein: Number(r.proteinas_consumidas) || 0,
    fiber: Number(r.fibra_consumida) || 0,
    fat: Number(r.grasas_consumidas) || 0,
    calories: Number(r.calorias_consumidas) || 0,
    sugar: Number(r.azucares_consumidos) || 0,
    sodium: Number(r.sodio_consumido) || 0,
  });

  // Carga desde la base de datos todo el historial del usuario; los consumos de hoy alimentan el
  // resumen y las alertas del día, y el historial completo la lista "Mis consumos"
  const cargarConsumosDeHoy = async () => {
    if (!isLoggedIn || !user?.id) {
      setConsumptions([]);
      setHistorial([]);
      return;
    }
    try {
      const todos = (await obtenerHistorialConsumos()).map(aConsumo);
      const hoy = new Date().toLocaleDateString("en-CA");
      const lista = todos.filter((c: Consumption) => c.date === hoy);
      setHistorial(todos);
      setConsumptions(lista);
      return lista;
    } catch (error) {
      console.error("Error cargando consumos:", error);
    }
  };

  useEffect(() => {
    cargarConsumosDeHoy();
  }, [isLoggedIn, user?.id]);

  const registrandoConsumo = useRef(false);
  const handleAddConsumption = async (consumption: any) => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Debes iniciar sesión para registrar consumos");
      setLoginModalOpen(true);
      return false;
    }
    // Un doble clic en «Guardar» no debe registrar el mismo consumo dos veces
    if (registrandoConsumo.current) return false;
    registrandoConsumo.current = true;

    try {
      await registrarConsumo({
        platilloId: parseInt(consumption.recipeId || consumption.id),
        mealTime: consumption.mealTime,
        portions: consumption.portions || 1,
        hora: consumption.time || undefined,
        rating: consumption.rating,
        comment: consumption.comment
      });

      // Se recarga desde la base de datos para mostrar exactamente lo guardado
      const antes = new Set(calcularAlertas(consumptions).map(a => a.clave));
      const lista = await cargarConsumosDeHoy();

      if (consumption.rating) setVersionCatalogo((v) => v + 1);
      toast.success("Consumo registrado correctamente", {
        description: `${consumption.recipeName} • ${consumption.mealTime}`
      });
      // Alerta inmediata si este registro supera el límite de sodio o de azúcares del día
      for (const alerta of calcularAlertas(lista || [])) {
        if (!antes.has(alerta.clave)) toast.warning(alerta.titulo, { description: alerta.mensaje, duration: 8000 });
      }
      return true;
    } catch (error: any) {
      console.error("Error registrando consumo:", error);
      toast.error(error?.message || "Error al guardar el consumo en la base de datos");
      return false;
    } finally {
      registrandoConsumo.current = false;
    }
  };

  const handleRemoveConsumption = async (id: string) => {
    try {
      await eliminarConsumo(id);
      await cargarConsumosDeHoy();
      toast.success("Consumo eliminado");
    } catch (error: any) {
      console.error("Error eliminando consumo:", error);
      toast.error(error?.message || "No se pudo eliminar el consumo");
    }
  };

  const resetFilters = () => {
    setSelectedFlavor('Todas');
    setSelectedCategory('Todas');
    setSelectedPreference('Todas');
    setShowFavoritesOnly(false);
    setShowTopRatedOnly(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredRecipes = useMemo(() => {
    if ((activeSmartTab === 'smart-search' || activeSmartTab === 'inventory') && smartSearchFilteredRecipes.length > 0) {
      return smartSearchFilteredRecipes.map(r => ({
        ...r,
        isFavorite: favoriteIds.includes(r.id)
      }));
    }

    let result = recipes.map(r => ({
      ...r,
      isFavorite: favoriteIds.includes(r.id)
    }));

    if (searchTerm) {
      // Búsqueda por nombre, descripción o ingrediente, sin distinguir tildes ni mayúsculas
      const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const termino = normalizar(searchTerm.trim());
      result = result.filter(recipe =>
        normalizar(recipe.title).includes(termino) ||
        normalizar(recipe.description).includes(termino) ||
        recipe.ingredients.some(ing => normalizar(ing).includes(termino))
      );
    }

    if (showFavoritesOnly) result = result.filter(r => r.isFavorite);
    if (showTopRatedOnly) result = result.filter(r => (r.ratingCount || 0) > 0 && (r.rating || 0) >= 4);

    if (selectedFlavor !== 'Todas') result = result.filter(r =>
      (Array.isArray(r.flavor) ? r.flavor.includes(selectedFlavor) : r.flavor === selectedFlavor));
    if (selectedCategory !== 'Todas') result = result.filter(r => r.category === selectedCategory);
    if (selectedPreference !== 'Todas') result = result.filter(r =>
      (Array.isArray(r.preference) ? r.preference.includes(selectedPreference) : r.preference === selectedPreference));

    return result;
  }, [recipes, searchTerm, favoriteIds, showFavoritesOnly, showTopRatedOnly, selectedFlavor, selectedCategory, selectedPreference, activeSmartTab, smartSearchFilteredRecipes]);

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);

  const displayedRecipes = useMemo(() => {
    if (!isLoggedIn) return filteredRecipes.slice(0, 11);
    const startIndex = (currentPage - 1) * recipesPerPage;
    return filteredRecipes.slice(startIndex, startIndex + recipesPerPage);
  }, [filteredRecipes, currentPage, isLoggedIn]);

  const hasActiveFilters = selectedFlavor !== 'Todas' || selectedCategory !== 'Todas' || selectedPreference !== 'Todas' || showFavoritesOnly || showTopRatedOnly || searchTerm !== '';

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFlavor, selectedCategory, selectedPreference, searchTerm, showFavoritesOnly, showTopRatedOnly]);

  const smartTabs = [
    { id: 'smart-search', label: 'Búsqueda Inteligente', icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'inventory', label: 'Con lo que tengas a mano', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'daily', label: 'Recomendaciones del día', icon: Lightbulb, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'ml', label: 'Para ti (IA)', icon: BrainCircuit, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'consumption', label: 'Tus Consumos', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'salud', label: 'Mi salud', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'plate-analysis', label: 'Análisis de Plato', icon: Scan, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const handleSmartTabClick = (id: string) => {
    if (activeSmartTab === id) {
      setActiveSmartTab(null);
      // Limpiar filtros de SmartSearch al cerrar
      if (id === 'smart-search') {
        setSmartSearchFilteredRecipes([]);
      }
    } else {
      setActiveSmartTab(id);
    }
  };

  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  const handleSwitchToForgotPassword = () => {
    setLoginModalOpen(false);
    setForgotPasswordModalOpen(true);
  };

  const handleBackToLogin = () => {
    setForgotPasswordModalOpen(false);
    setLoginModalOpen(true);
  };

  return (
    <section id="recetas" className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* loading state */}
        {isLoadingRecipes && (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando recetas desde la base de datos...</p>
          </div>
        )}

        {/* Error State */}
        {errorRecipes && !isLoadingRecipes && (
          <div className="text-center py-20 text-red-500">
            {errorRecipes}
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reintentar
            </Button>
          </div>
        )}

        {/*CONTENIDO principal*/}
        {!isLoadingRecipes && !errorRecipes && (
          <>
            {isLoggedIn && user && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-10"
                >
                  <button
                    onClick={() => toast.info('Próximamente', {
                      description: 'El análisis del plato por fotografía estará disponible en una próxima versión de GessenApp.'
                    })}
                    aria-disabled="true"
                    className="w-full relative group overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-8 shadow-2xl opacity-90 cursor-default"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl animate-pulse"></div>
                          <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/40">
                            <Scan className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl md:text-3xl font-black text-white">
                              Analizar Plato con IA
                            </h3>
                            <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-black text-white border border-white/40">
                              PRÓXIMAMENTE
                            </span>
                          </div>
                          <p className="text-purple-100 text-base md:text-lg">
                            Muy pronto podrás subir una foto de tu comida y conocer su aporte nutricional
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:flex flex-col items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                        <span className="text-xs font-bold text-white">En desarrollo</span>
                      </div>
                    </div>
                  </button>
                </motion.div>

              </>
            )}

            {/* Catalog Title for Non-Logged In Users */}
            {!isLoggedIn && (
              <div className="text-center mb-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold text-gray-900 mb-4"
                >
                  Nuestro Catálogo de Recetas
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
                >
                  Filtra por sabor, preferencia o tipo de comida para encontrar tu plato ideal.
                </motion.p>
              </div>
            )}

            <AnimatePresence>
              {isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center mb-10"
                >
                  <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner max-w-full overflow-x-auto no-scrollbar">
                    {smartTabs.filter(tab => tab.id !== 'plate-analysis').map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleSmartTabClick(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeSmartTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                          }`}
                      >
                        <tab.icon className={`w-4 h-4 ${activeSmartTab === tab.id ? tab.color : 'text-gray-400'}`} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Content Area (Simplified placeholder) */}
                  <AnimatePresence mode="wait">
                    {activeSmartTab && (
                      <motion.div
                        key={activeSmartTab}
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className={`mt-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 w-full ${activeSmartTab === 'salud' ? 'max-w-5xl' : 'max-w-3xl'} text-left shadow-sm`}
                      >
                        {activeSmartTab === 'smart-search' ? (
                          <SmartSearchTab
                            user={user}
                            recipes={recipes}
                            onFilterChange={setSmartSearchFilteredRecipes}
                          />
                        ) : activeSmartTab === 'inventory' ? (
                          <InventoryTab
                            user={user}
                            recipes={recipes}
                            onFilterChange={setSmartSearchFilteredRecipes}
                          />
                        ) : activeSmartTab === 'daily' ? (
                          <DailyRecommendationsTab
                            user={user}
                            recipes={recipes}
                            onRecipeClick={handleRecipeClick}
                          />
                        ) : activeSmartTab === 'ml' ? (
                          <MLRecommendationsTab
                            recipes={recipes}
                            onRecipeClick={handleRecipeClick}
                            version={historial.length}
                          />
                        ) : activeSmartTab === 'salud' ? (
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-black text-gray-900">Mi salud</h4>
                              <p className="text-sm text-gray-600">
                                Registra tus exámenes (glucemia, HbA1c, perfil lipídico, creatinina) y tu peso para ver su evolución.
                                Tu profesional de salud también puede registrar aquí las medidas tomadas en consulta.
                              </p>
                            </div>
                            <Suspense fallback={<p className="text-sm text-gray-500 py-6 text-center">Cargando...</p>}>
                              <SeguimientoClinico modo="paciente" />
                            </Suspense>
                          </div>
                        ) : activeSmartTab === 'consumption' ? (
                          <ConsumptionTab
                            user={user}
                            recipes={recipes}
                            externalConsumptions={consumptions}
                            historial={historial}
                            onAddConsumption={handleAddConsumption}
                            onRemoveConsumption={handleRemoveConsumption}
                          />
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${smartTabs.find(t => t.id === activeSmartTab)?.bg}`}>
                                {activeSmartTab === 'consumption' && <Activity className="w-5 h-5 text-purple-600" />}
                              </div>
                              <h3 className="font-black text-gray-900">{smartTabs.find(t => t.id === activeSmartTab)?.label}</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Estamos procesando tu perfil nutricional (Altura, Peso y Edad) para ofrecerte resultados 100% personalizados. Pronto podrás interactuar con esta herramienta avanzada.
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Improved Multi-Filter System */}
            {!activeSmartTab && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-3xl border border-gray-100 mb-10 shadow-sm"
              >
                <div className="space-y-8">
                  {/* Search Bar */}
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="¿Qué te apetece hoy? Busca por ingrediente o nombre..."
                      className="pl-12 h-14 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-2xl text-base shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Sabor Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Sabores</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {flavors.map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedFlavor(f)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedFlavor === f
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tipo de Comida Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Tipo de Comida</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedCategory(c)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === c
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
                              }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferencias Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Preferencias</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preferences.map((p) => (
                          <button
                            key={p}
                            onClick={() => setSelectedPreference(p)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedPreference === p
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-400'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Special Filters Row */}
                  <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                      >
                        <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                        Mis Favoritos
                      </button>
                      <button
                        onClick={() => setShowTopRatedOnly(!showTopRatedOnly)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showTopRatedOnly ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                      >
                        <Star className={`w-4 h-4 ${showTopRatedOnly ? 'fill-current' : ''}`} />
                        Populares
                      </button>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                        onClick={resetFilters}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar Filtros
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recipe Grid */}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {displayedRecipes.map((recipe) => (
                  <motion.div
                    layout
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </motion.div>
                ))}

                {!isLoggedIn && (
                  <motion.div
                    layout
                    key="more-recipes-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MoreRecipesCard
                      onClick={() => setLoginModalOpen(true)}
                      isLoggedIn={isLoggedIn}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Numerical Pagination for Logged In Users */}
            {isLoggedIn && totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* En el teléfono se muestra «página actual / total» en lugar de todos los números */}
                <span className="sm:hidden text-sm font-bold text-gray-600 px-3">{currentPage} / {totalPages}</span>
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-white hover:text-green-600'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {displayedRecipes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-8"
              >
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No encontramos recetas con esta combinación de filtros.</p>
                <Button
                  variant="link"
                  className="text-green-600 mt-2 font-semibold"
                  onClick={resetFilters}
                >
                  Ver todas las recetas
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedRecipe && recipeModalOpen && (
          <Suspense fallback={null}>
          <RecipeModal
            recipe={selectedRecipe}
            open={recipeModalOpen}
            onClose={() => setRecipeModalOpen(false)}
            onRegisterConsumption={(consumptionData) => {
              // Esta función se llamará desde ConsumptionRegisterModal
              handleAddConsumption(consumptionData);
            }}
          />
          </Suspense>
        )}
      </AnimatePresence>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
        onLoginSuccess={onLoginSuccess}
      />

      <RegisterModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
        onRegisterSuccess={onLoginSuccess}
      />

      <ForgotPasswordModal
        open={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onBackToLogin={handleBackToLogin}
      />
    </section>
  );
}