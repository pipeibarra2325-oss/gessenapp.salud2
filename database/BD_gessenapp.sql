--
-- PostgreSQL database dump
--

\restrict aoSNegWQz063dAETBh71VrbtnSLhwEfDM8jhPG3YgaDYcfsthmFZBZGTDxcG2ch

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-17 23:22:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 248 (class 1259 OID 16722)
-- Name: categorias_platillo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias_platillo (
    id_categoria integer NOT NULL,
    nombre character varying(50) NOT NULL,
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.categorias_platillo OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16721)
-- Name: categorias_platillo_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_platillo_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_platillo_id_categoria_seq OWNER TO postgres;

--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 247
-- Name: categorias_platillo_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_platillo_id_categoria_seq OWNED BY public.categorias_platillo.id_categoria;


--
-- TOC entry 224 (class 1259 OID 16410)
-- Name: departamentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departamentos (
    id_departamento integer NOT NULL,
    nombre_departamento character varying(100) NOT NULL,
    id_region integer
);


ALTER TABLE public.departamentos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16409)
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departamentos_id_departamento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departamentos_id_departamento_seq OWNER TO postgres;

--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 223
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departamentos_id_departamento_seq OWNED BY public.departamentos.id_departamento;


--
-- TOC entry 228 (class 1259 OID 16452)
-- Name: enfermedades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enfermedades (
    id_enfermedad integer NOT NULL,
    nombre_enfermedad character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.enfermedades OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16451)
-- Name: enfermedades_id_enfermedad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enfermedades_id_enfermedad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enfermedades_id_enfermedad_seq OWNER TO postgres;

--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 227
-- Name: enfermedades_id_enfermedad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enfermedades_id_enfermedad_seq OWNED BY public.enfermedades.id_enfermedad;


--
-- TOC entry 238 (class 1259 OID 16550)
-- Name: historial_consumo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_consumo (
    id_historial integer NOT NULL,
    id_usuario integer,
    id_platillo integer,
    fecha_consumo date,
    porcion_consumida numeric,
    meal_time character varying(20),
    rating_usuario smallint,
    fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_synthetic boolean DEFAULT false,
    porcion_gramos numeric,
    comentario text,
    CONSTRAINT historial_consumo_rating_usuario_check CHECK (((rating_usuario >= 1) AND (rating_usuario <= 5)))
);


ALTER TABLE public.historial_consumo OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16549)
-- Name: historial_consumo_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_consumo_id_historial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_consumo_id_historial_seq OWNER TO postgres;

--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 237
-- Name: historial_consumo_id_historial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_consumo_id_historial_seq OWNED BY public.historial_consumo.id_historial;


--
-- TOC entry 242 (class 1259 OID 16621)
-- Name: ingrediente_valores_nutricionales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingrediente_valores_nutricionales (
    id integer NOT NULL,
    id_ingrediente integer,
    id_nutriente integer,
    cantidad_por_100g numeric(12,4),
    indice_glucemico integer,
    nivel_glucemico character varying(20)
);


ALTER TABLE public.ingrediente_valores_nutricionales OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16620)
-- Name: ingrediente_valores_nutricionales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingrediente_valores_nutricionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingrediente_valores_nutricionales_id_seq OWNER TO postgres;

--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 241
-- Name: ingrediente_valores_nutricionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingrediente_valores_nutricionales_id_seq OWNED BY public.ingrediente_valores_nutricionales.id;


--
-- TOC entry 233 (class 1259 OID 16493)
-- Name: ingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredientes (
    id_ingrediente integer NOT NULL,
    nombre_ingrediente character varying(100) NOT NULL,
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.ingredientes OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16492)
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredientes_id_ingrediente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredientes_id_ingrediente_seq OWNER TO postgres;

--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 232
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredientes_id_ingrediente_seq OWNED BY public.ingredientes.id_ingrediente;


--
-- TOC entry 240 (class 1259 OID 16584)
-- Name: nutrientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nutrientes (
    id_nutriente integer NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad character varying(20) NOT NULL,
    tipo character varying(50) NOT NULL
);


ALTER TABLE public.nutrientes OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16583)
-- Name: nutrientes_id_nutriente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nutrientes_id_nutriente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nutrientes_id_nutriente_seq OWNER TO postgres;

--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 239
-- Name: nutrientes_id_nutriente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nutrientes_id_nutriente_seq OWNED BY public.nutrientes.id_nutriente;


--
-- TOC entry 244 (class 1259 OID 16651)
-- Name: platillo_calificaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platillo_calificaciones (
    id_calificacion integer NOT NULL,
    id_usuario integer NOT NULL,
    id_platillo integer NOT NULL,
    rating smallint NOT NULL,
    comentario text,
    fecha_calificacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_synthetic boolean DEFAULT false,
    CONSTRAINT platillo_calificaciones_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.platillo_calificaciones OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16650)
-- Name: platillo_calificaciones_id_calificacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platillo_calificaciones_id_calificacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platillo_calificaciones_id_calificacion_seq OWNER TO postgres;

--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 243
-- Name: platillo_calificaciones_id_calificacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platillo_calificaciones_id_calificacion_seq OWNED BY public.platillo_calificaciones.id_calificacion;


--
-- TOC entry 231 (class 1259 OID 16480)
-- Name: platillos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platillos (
    id_platillo integer NOT NULL,
    nombre_platillo character varying(150) NOT NULL,
    descripcion text,
    imagen_url text,
    nivel_glucemico character varying(50),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    porcion_gramos numeric(10,2),
    tiempo_preparacion integer,
    porcion_personas smallint DEFAULT 1,
    preparacion text,
    is_synthetic boolean DEFAULT false,
    id_categoria integer
);


ALTER TABLE public.platillos OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16479)
-- Name: platillos_id_platillo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platillos_id_platillo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platillos_id_platillo_seq OWNER TO postgres;

--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 230
-- Name: platillos_id_platillo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platillos_id_platillo_seq OWNED BY public.platillos.id_platillo;


--
-- TOC entry 234 (class 1259 OID 16501)
-- Name: platillos_ingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platillos_ingredientes (
    id_platillo integer NOT NULL,
    id_ingrediente integer NOT NULL,
    cantidad numeric,
    unidad character varying(20),
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.platillos_ingredientes OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16774)
-- Name: platillos_preferencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platillos_preferencias (
    id_platillo integer NOT NULL,
    id_preferencia integer NOT NULL
);


ALTER TABLE public.platillos_preferencias OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 16757)
-- Name: platillos_sabores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platillos_sabores (
    id_platillo integer NOT NULL,
    id_sabor integer NOT NULL
);


ALTER TABLE public.platillos_sabores OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 16746)
-- Name: preferencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferencias (
    id_preferencia integer NOT NULL,
    nombre character varying(100) NOT NULL,
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.preferencias OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 16745)
-- Name: preferencias_id_preferencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preferencias_id_preferencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preferencias_id_preferencia_seq OWNER TO postgres;

--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 251
-- Name: preferencias_id_preferencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preferencias_id_preferencia_seq OWNED BY public.preferencias.id_preferencia;


--
-- TOC entry 236 (class 1259 OID 16532)
-- Name: recomendaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recomendaciones (
    id_recomendacion integer NOT NULL,
    id_enfermedad integer,
    id_platillo integer,
    score_ml numeric(5,2),
    algoritmo character varying(50),
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.recomendaciones OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16531)
-- Name: recomendaciones_id_recomendacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recomendaciones_id_recomendacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recomendaciones_id_recomendacion_seq OWNER TO postgres;

--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 235
-- Name: recomendaciones_id_recomendacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recomendaciones_id_recomendacion_seq OWNED BY public.recomendaciones.id_recomendacion;


--
-- TOC entry 222 (class 1259 OID 16401)
-- Name: regiones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regiones (
    id_region integer NOT NULL,
    nombre_region character varying(100) NOT NULL
);


ALTER TABLE public.regiones OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16400)
-- Name: regiones_id_region_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regiones_id_region_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regiones_id_region_seq OWNER TO postgres;

--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 221
-- Name: regiones_id_region_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regiones_id_region_seq OWNED BY public.regiones.id_region;


--
-- TOC entry 220 (class 1259 OID 16390)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- TOC entry 250 (class 1259 OID 16734)
-- Name: sabores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sabores (
    id_sabor integer NOT NULL,
    nombre character varying(50) NOT NULL,
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.sabores OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 16733)
-- Name: sabores_id_sabor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sabores_id_sabor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sabores_id_sabor_seq OWNER TO postgres;

--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 249
-- Name: sabores_id_sabor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sabores_id_sabor_seq OWNED BY public.sabores.id_sabor;


--
-- TOC entry 226 (class 1259 OID 16424)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    genero character varying(20),
    telefono character varying(20),
    fecha_nacimiento date,
    estatura numeric(5,2),
    peso numeric(5,2),
    id_departamento integer,
    id_rol integer DEFAULT 1,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16462)
-- Name: usuarios_enfermedades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios_enfermedades (
    id_usuario integer NOT NULL,
    id_enfermedad integer NOT NULL
);


ALTER TABLE public.usuarios_enfermedades OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 16680)
-- Name: usuarios_favoritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios_favoritos (
    id_favorito integer NOT NULL,
    id_usuario integer NOT NULL,
    id_platillo integer NOT NULL,
    fecha_agregado timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_synthetic boolean DEFAULT false
);


ALTER TABLE public.usuarios_favoritos OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16679)
-- Name: usuarios_favoritos_id_favorito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_favoritos_id_favorito_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_favoritos_id_favorito_seq OWNER TO postgres;

--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 245
-- Name: usuarios_favoritos_id_favorito_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_favoritos_id_favorito_seq OWNED BY public.usuarios_favoritos.id_favorito;


--
-- TOC entry 225 (class 1259 OID 16423)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 225
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 4974 (class 2604 OID 16725)
-- Name: categorias_platillo id_categoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_platillo ALTER COLUMN id_categoria SET DEFAULT nextval('public.categorias_platillo_id_categoria_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 16413)
-- Name: departamentos id_departamento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departamentos ALTER COLUMN id_departamento SET DEFAULT nextval('public.departamentos_id_departamento_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 16455)
-- Name: enfermedades id_enfermedad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enfermedades ALTER COLUMN id_enfermedad SET DEFAULT nextval('public.enfermedades_id_enfermedad_seq'::regclass);


--
-- TOC entry 4963 (class 2604 OID 16553)
-- Name: historial_consumo id_historial; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_consumo ALTER COLUMN id_historial SET DEFAULT nextval('public.historial_consumo_id_historial_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 16624)
-- Name: ingrediente_valores_nutricionales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingrediente_valores_nutricionales ALTER COLUMN id SET DEFAULT nextval('public.ingrediente_valores_nutricionales_id_seq'::regclass);


--
-- TOC entry 4958 (class 2604 OID 16496)
-- Name: ingredientes id_ingrediente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes ALTER COLUMN id_ingrediente SET DEFAULT nextval('public.ingredientes_id_ingrediente_seq'::regclass);


--
-- TOC entry 4966 (class 2604 OID 16587)
-- Name: nutrientes id_nutriente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrientes ALTER COLUMN id_nutriente SET DEFAULT nextval('public.nutrientes_id_nutriente_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 16654)
-- Name: platillo_calificaciones id_calificacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillo_calificaciones ALTER COLUMN id_calificacion SET DEFAULT nextval('public.platillo_calificaciones_id_calificacion_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 16483)
-- Name: platillos id_platillo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos ALTER COLUMN id_platillo SET DEFAULT nextval('public.platillos_id_platillo_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 16749)
-- Name: preferencias id_preferencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias ALTER COLUMN id_preferencia SET DEFAULT nextval('public.preferencias_id_preferencia_seq'::regclass);


--
-- TOC entry 4961 (class 2604 OID 16535)
-- Name: recomendaciones id_recomendacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recomendaciones ALTER COLUMN id_recomendacion SET DEFAULT nextval('public.recomendaciones_id_recomendacion_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 16404)
-- Name: regiones id_region; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regiones ALTER COLUMN id_region SET DEFAULT nextval('public.regiones_id_region_seq'::regclass);


--
-- TOC entry 4947 (class 2604 OID 16393)
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- TOC entry 4976 (class 2604 OID 16737)
-- Name: sabores id_sabor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sabores ALTER COLUMN id_sabor SET DEFAULT nextval('public.sabores_id_sabor_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 16427)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 16683)
-- Name: usuarios_favoritos id_favorito; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_favoritos ALTER COLUMN id_favorito SET DEFAULT nextval('public.usuarios_favoritos_id_favorito_seq'::regclass);


--
-- TOC entry 5243 (class 0 OID 16722)
-- Dependencies: 248
-- Data for Name: categorias_platillo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias_platillo (id_categoria, nombre, is_synthetic) FROM stdin;
1	Desayuno	f
2	Almuerzo	f
3	Cena	f
4	Merienda	f
5	Snack	f
6	Postre	f
\.


--
-- TOC entry 5219 (class 0 OID 16410)
-- Dependencies: 224
-- Data for Name: departamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departamentos (id_departamento, nombre_departamento, id_region) FROM stdin;
1	Amazonas	1
2	Caquetá	1
3	Guainía	1
4	Guaviare	1
5	Putumayo	1
6	Vaupés	1
7	Antioquia	2
8	Boyacá	2
9	Caldas	2
10	Cundinamarca	2
11	Huila	2
12	Norte de Santander	2
13	Quindío	2
14	Risaralda	2
15	Santander	2
16	Tolima	2
17	Bogotá D.C.	2
18	Atlántico	3
19	Bolívar	3
20	Cesar	3
21	Córdoba	3
22	La Guajira	3
23	Magdalena	3
24	Sucre	3
25	San Andrés y Providencia	4
26	Arauca	5
27	Casanare	5
28	Meta	5
29	Vichada	5
30	Cauca	6
31	Chocó	6
32	Nariño	6
33	Valle del Cauca	6
\.


--
-- TOC entry 5223 (class 0 OID 16452)
-- Dependencies: 228
-- Data for Name: enfermedades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enfermedades (id_enfermedad, nombre_enfermedad, descripcion) FROM stdin;
1	Diabetes	Enfermedad crónica caracterizada por niveles elevados de glucosa en sangre.
2	Obesidad	Trastorno caracterizado por niveles excesivos de grasa corporal que aumentan el riesgo de problemas de salud.
\.


--
-- TOC entry 5233 (class 0 OID 16550)
-- Dependencies: 238
-- Data for Name: historial_consumo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_consumo (id_historial, id_usuario, id_platillo, fecha_consumo, porcion_consumida, meal_time, rating_usuario, fecha_registro, is_synthetic, porcion_gramos, comentario) FROM stdin;
\.


--
-- TOC entry 5237 (class 0 OID 16621)
-- Dependencies: 242
-- Data for Name: ingrediente_valores_nutricionales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingrediente_valores_nutricionales (id, id_ingrediente, id_nutriente, cantidad_por_100g, indice_glucemico, nivel_glucemico) FROM stdin;
1	1	1	165.0000	0	bajo
2	1	2	0.0000	0	bajo
3	1	3	0.0000	0	bajo
4	1	4	0.0000	0	bajo
5	1	5	31.0000	0	bajo
6	1	6	3.6000	0	bajo
7	1	7	74.0000	0	bajo
8	2	1	96.0000	0	bajo
9	2	2	0.0000	0	bajo
10	2	3	0.0000	0	bajo
11	2	4	0.0000	0	bajo
12	2	5	20.1000	0	bajo
13	2	6	1.7000	0	bajo
14	2	7	43.0000	0	bajo
15	3	1	208.0000	0	bajo
16	3	2	0.0000	0	bajo
17	3	3	0.0000	0	bajo
18	3	4	0.0000	0	bajo
19	3	5	20.0000	0	bajo
20	3	6	13.0000	0	bajo
21	3	7	59.0000	0	bajo
22	4	1	116.0000	0	bajo
23	4	2	0.0000	0	bajo
24	4	3	0.0000	0	bajo
25	4	4	0.0000	0	bajo
26	4	5	25.5000	0	bajo
27	4	6	0.8000	0	bajo
28	4	7	47.0000	0	bajo
29	5	1	143.0000	0	bajo
30	5	2	0.7000	0	bajo
31	5	3	0.4000	0	bajo
32	5	4	0.0000	0	bajo
33	5	5	12.6000	0	bajo
34	5	6	9.5000	0	bajo
35	5	7	142.0000	0	bajo
36	6	1	76.0000	15	bajo
37	6	2	1.9000	15	bajo
38	6	3	0.7000	15	bajo
39	6	4	0.9000	15	bajo
40	6	5	8.1000	15	bajo
41	6	6	4.2000	15	bajo
42	6	7	7.0000	15	bajo
43	7	1	61.0000	35	medio
44	7	2	4.7000	35	medio
45	7	3	4.7000	35	medio
46	7	4	0.0000	35	medio
47	7	5	3.5000	35	medio
48	7	6	3.3000	35	medio
49	7	7	46.0000	35	medio
50	8	1	379.0000	55	medio
51	8	2	67.7000	55	medio
52	8	3	1.5000	55	medio
53	8	4	10.1000	55	medio
54	8	5	13.2000	55	medio
55	8	6	6.5000	55	medio
56	8	7	6.0000	55	medio
57	9	1	120.0000	53	medio
58	9	2	21.3000	53	medio
59	9	3	0.9000	53	medio
60	9	4	2.8000	53	medio
61	9	5	4.4000	53	medio
62	9	6	1.9000	53	medio
63	9	7	7.0000	53	medio
64	10	1	123.0000	50	medio
65	10	2	25.6000	50	medio
66	10	3	0.4000	50	medio
67	10	4	1.6000	50	medio
68	10	5	2.7000	50	medio
69	10	6	1.0000	50	medio
70	10	7	5.0000	50	medio
71	11	1	116.0000	30	bajo
72	11	2	20.1000	30	bajo
73	11	3	1.8000	30	bajo
74	11	4	7.9000	30	bajo
75	11	5	9.0000	30	bajo
76	11	6	0.4000	30	bajo
77	11	7	2.0000	30	bajo
78	12	1	127.0000	23	bajo
79	12	2	23.0000	25	bajo
80	12	3	0.5000	25	bajo
81	12	4	6.3000	25	bajo
82	12	5	8.2000	25	bajo
83	12	6	0.5000	25	bajo
84	12	7	2.0000	25	bajo
85	13	1	164.0000	27	medio
86	13	2	27.0000	35	medio
87	13	3	4.8000	35	medio
88	13	4	7.6000	35	medio
89	13	5	8.9000	35	medio
90	13	6	2.6000	35	medio
91	13	7	7.0000	35	medio
92	14	1	23.0000	0	bajo
93	14	2	3.6000	0	bajo
94	14	3	0.4000	0	bajo
95	14	4	2.2000	0	bajo
96	14	5	2.9000	0	bajo
97	14	6	0.4000	0	bajo
98	14	7	79.0000	0	bajo
99	15	1	34.0000	15	bajo
100	15	2	6.6000	15	bajo
101	15	3	1.7000	15	bajo
102	15	4	2.6000	15	bajo
103	15	5	2.8000	15	bajo
104	15	6	0.4000	15	bajo
105	15	7	33.0000	15	bajo
106	16	1	17.0000	0	bajo
107	16	2	3.3000	0	bajo
108	16	3	1.0000	0	bajo
109	16	4	2.1000	0	bajo
110	16	5	1.2000	0	bajo
111	16	6	0.3000	0	bajo
112	16	7	8.0000	0	bajo
113	17	1	18.0000	15	bajo
114	17	2	3.9000	15	bajo
115	17	3	2.6000	15	bajo
116	17	4	1.2000	15	bajo
117	17	5	0.9000	15	bajo
118	17	6	0.2000	15	bajo
119	17	7	5.0000	15	bajo
120	18	1	15.0000	15	bajo
121	18	2	3.6000	15	bajo
122	18	3	1.7000	15	bajo
123	18	4	0.5000	15	bajo
124	18	5	0.7000	15	bajo
125	18	6	0.1000	15	bajo
126	18	7	2.0000	15	bajo
127	19	1	41.0000	35	medio
128	19	2	9.6000	35	medio
129	19	3	4.7000	35	medio
130	19	4	2.8000	35	medio
131	19	5	0.9000	35	medio
132	19	6	0.2000	35	medio
133	19	7	69.0000	35	medio
134	20	1	160.0000	15	bajo
135	20	2	8.5000	15	bajo
136	20	3	0.7000	15	bajo
137	20	4	6.7000	15	bajo
138	20	5	2.0000	15	bajo
139	20	6	14.7000	15	bajo
140	20	7	7.0000	15	bajo
141	21	1	884.0000	0	bajo
142	21	2	0.0000	0	bajo
143	21	3	0.0000	0	bajo
144	21	4	0.0000	0	bajo
145	21	5	0.0000	0	bajo
146	21	6	100.0000	0	bajo
147	21	7	2.0000	0	bajo
148	22	1	579.0000	0	bajo
149	22	2	21.6000	0	bajo
150	22	3	4.4000	0	bajo
151	22	4	12.5000	0	bajo
152	22	5	21.2000	0	bajo
153	22	6	49.9000	0	bajo
154	22	7	1.0000	0	bajo
155	23	1	654.0000	0	bajo
156	23	2	13.7000	0	bajo
157	23	3	2.6000	0	bajo
158	23	4	6.7000	0	bajo
159	23	5	15.2000	0	bajo
160	23	6	65.2000	0	bajo
161	23	7	2.0000	0	bajo
162	24	1	52.0000	36	medio
163	24	2	13.8000	36	medio
164	24	3	10.4000	36	medio
165	24	4	2.4000	36	medio
166	24	5	0.3000	36	medio
167	24	6	0.2000	36	medio
168	24	7	1.0000	36	medio
169	25	1	57.0000	38	medio
170	25	2	15.2000	38	medio
171	25	3	9.8000	38	medio
172	25	4	3.1000	38	medio
173	25	5	0.4000	38	medio
174	25	6	0.1000	38	medio
175	25	7	1.0000	38	medio
176	26	1	89.0000	51	medio
177	26	2	22.8000	51	medio
178	26	3	12.2000	51	medio
179	26	4	2.6000	51	medio
180	26	5	1.1000	51	medio
181	26	6	0.3000	51	medio
182	26	7	1.0000	51	medio
183	27	1	32.0000	40	medio
184	27	2	7.7000	40	medio
185	27	3	4.9000	40	medio
186	27	4	2.0000	40	medio
187	27	5	0.7000	40	medio
188	27	6	0.3000	40	medio
189	27	7	1.0000	40	medio
190	28	1	43.0000	12	bajo
191	28	2	10.2000	12	bajo
192	28	3	4.9000	12	bajo
193	28	4	5.3000	12	bajo
194	28	5	1.4000	12	bajo
195	28	6	0.5000	12	bajo
196	28	7	1.0000	12	bajo
197	29	1	43.0000	11	bajo
198	29	2	10.8000	11	bajo
199	29	3	6.3000	11	bajo
200	29	4	1.7000	11	bajo
201	29	5	0.5000	11	bajo
202	29	6	0.3000	11	bajo
203	29	7	2.0000	11	bajo
204	30	1	76.0000	18	bajo
205	30	2	17.7000	18	bajo
206	30	3	5.5000	18	bajo
207	30	4	2.6000	18	bajo
208	30	5	1.4000	18	bajo
209	30	6	0.1000	18	bajo
210	30	7	27.0000	18	bajo
211	31	1	87.0000	20	medio
212	31	2	20.1000	78	alto
213	31	3	0.9000	78	alto
214	31	4	2.2000	78	alto
215	31	5	1.9000	78	alto
216	31	6	0.1000	78	alto
217	31	7	5.0000	78	alto
218	32	1	220.0000	45	medio
219	32	2	45.0000	70	medio
220	32	3	1.0000	70	medio
221	32	4	6.0000	70	medio
222	32	5	6.0000	70	medio
223	32	6	2.0000	70	medio
224	32	7	300.0000	70	medio
225	33	1	265.0000	49	medio
226	33	2	49.0000	70	medio
227	33	3	4.5000	70	medio
228	33	4	6.5000	70	medio
229	33	5	9.0000	70	medio
230	33	6	3.5000	70	medio
231	33	7	480.0000	70	medio
232	34	1	170.0000	4	bajo
233	34	2	4.0000	0	bajo
234	34	3	0.0000	0	bajo
235	34	4	0.0000	0	bajo
236	34	5	28.0000	0	bajo
237	34	6	8.0000	0	bajo
238	34	7	600.0000	0	bajo
239	35	1	34.0000	5	bajo
240	35	2	5.0000	0	bajo
241	35	3	5.0000	0	bajo
242	35	4	0.0000	0	bajo
243	35	5	3.4000	0	bajo
244	35	6	0.1000	0	bajo
245	35	7	42.0000	0	bajo
246	36	1	486.0000	42	bajo
247	36	2	42.0000	15	bajo
248	36	3	0.0000	15	bajo
249	36	4	34.4000	15	bajo
250	36	5	16.5000	15	bajo
251	36	6	30.7000	15	bajo
252	36	7	16.0000	15	bajo
253	37	1	534.0000	29	bajo
254	37	2	29.0000	5	bajo
255	37	3	1.5000	5	bajo
256	37	4	27.3000	5	bajo
257	37	5	18.3000	5	bajo
258	37	6	42.2000	5	bajo
259	37	7	30.0000	5	bajo
260	38	1	40.0000	9	bajo
261	38	2	9.3000	15	bajo
262	38	3	4.2000	15	bajo
263	38	4	1.7000	15	bajo
264	38	5	1.1000	15	bajo
265	38	6	0.1000	15	bajo
266	38	7	4.0000	15	bajo
267	39	1	149.0000	33	bajo
268	39	2	33.0000	15	bajo
269	39	3	1.0000	15	bajo
270	39	4	2.1000	15	bajo
271	39	5	6.4000	15	bajo
272	39	6	0.5000	15	bajo
273	39	7	17.0000	15	bajo
274	40	1	31.0000	6	bajo
275	40	2	6.0000	15	bajo
276	40	3	3.9000	15	bajo
277	40	4	2.1000	15	bajo
278	40	5	1.0000	15	bajo
279	40	6	0.3000	15	bajo
280	40	7	4.0000	15	bajo
\.


--
-- TOC entry 5228 (class 0 OID 16493)
-- Dependencies: 233
-- Data for Name: ingredientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredientes (id_ingrediente, nombre_ingrediente, is_synthetic) FROM stdin;
1	Pollo	t
2	Pescado blanco	t
3	Salmón	t
4	Atún	t
5	Huevo	t
6	Tofu	t
7	Yogur natural	t
8	Avena	t
9	Quinoa	t
10	Arroz integral	t
11	Lentejas	t
12	Frijoles	t
13	Garbanzos	t
14	Espinaca	t
15	Brócoli	t
16	Lechuga	t
17	Tomate	t
18	Pepino	t
19	Zanahoria	t
20	Aguacate	t
21	Aceite de oliva	t
22	Almendras	t
23	Nueces	t
24	Manzana	t
25	Pera	t
26	Banano	t
27	Fresas	t
28	Mora	t
29	Papaya	t
30	Batata	t
31	Papa	t
32	Arepa integral	t
33	Pan integral	t
34	Queso bajo grasa	t
35	Leche descremada	t
36	Semillas de chía	t
37	Linaza	t
38	Cebolla	t
39	Ajo	t
40	Pimentón	t
\.


--
-- TOC entry 5235 (class 0 OID 16584)
-- Dependencies: 240
-- Data for Name: nutrientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nutrientes (id_nutriente, nombre, unidad, tipo) FROM stdin;
1	Calorías	kcal	macronutriente
2	Carbohidratos	g	macronutriente
3	Azúcares	g	macronutriente
4	Fibra	g	macronutriente
5	Proteínas	g	macronutriente
6	Grasas	g	macronutriente
7	Sodio	mg	micronutriente
\.


--
-- TOC entry 5239 (class 0 OID 16651)
-- Dependencies: 244
-- Data for Name: platillo_calificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platillo_calificaciones (id_calificacion, id_usuario, id_platillo, rating, comentario, fecha_calificacion, is_synthetic) FROM stdin;
\.


--
-- TOC entry 5226 (class 0 OID 16480)
-- Dependencies: 231
-- Data for Name: platillos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platillos (id_platillo, nombre_platillo, descripcion, imagen_url, nivel_glucemico, fecha_creacion, porcion_gramos, tiempo_preparacion, porcion_personas, preparacion, is_synthetic, id_categoria) FROM stdin;
13	Tortilla de huevo con tomate	Tortilla ligera de huevo con tomate fresco.	https://gessenapp.co/images/platillos/tortilla_huevo_tomate.jpg	bajo	2025-04-15 10:00:00	280.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
9	Tofu salteado con verduras	Tofu firme salteado con verduras mixtas, opción vegana excelente.	https://gessenapp.co/images/platillos/tofu_verduras.jpg	bajo	2025-05-15 10:00:00	350.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
2	Salmón con brócoli al vapor	Salmón rico en omega-3 acompañado de brócoli, excelente opción para cena ligera y control glucémico.	https://gessenapp.co/images/platillos/salmon_brocoli.jpg	bajo	2025-10-31 10:00:00	300.00	25	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
6	Yogur natural con chía y fresas	Yogur natural sin azúcar con semillas de chía y fresas frescas.	https://gessenapp.co/images/platillos/yogur_chia_fresas.jpg	bajo	2025-12-14 10:00:00	280.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	4
95	Papa frita con salsa	Papas fritas con salsa.	https://gessenapp.co/images/platillos/papa_frita.jpg	alto	2025-09-05 10:00:00	300.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	5
92	Pastel de yuca	Pastel tradicional de yuca.	https://gessenapp.co/images/platillos/pastel_yuca.jpg	alto	2026-02-02 10:00:00	380.00	50	8	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	5
85	Papa rellena	Papa rellena de carne tradicional.	https://gessenapp.co/images/platillos/papa_rellena.jpg	alto	2025-10-12 10:00:00	380.00	40	4	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	5
78	Empanadas con papa	Empanadas de papa fritas.	https://gessenapp.co/images/platillos/empanadas_papa.jpg	alto	2025-10-03 10:00:00	380.00	40	4	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	5
88	Gaseosa y snack	Gaseosa con snack procesado.	https://gessenapp.co/images/platillos/gaseosa_snack.jpg	alto	2025-05-10 10:00:00	300.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	5
93	Arroz con leche	Arroz con leche tradicional.	https://gessenapp.co/images/platillos/arroz_leche.jpg	alto	2025-06-29 10:00:00	280.00	35	4	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	6
89	Muffin de chocolate	Muffin dulce de chocolate.	https://gessenapp.co/images/platillos/muffin_chocolate.jpg	alto	2026-01-24 10:00:00	280.00	25	6	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	6
83	Torta de zanahoria azucarada	Torta de zanahoria con frosting.	https://gessenapp.co/images/platillos/torta_zanahoria.jpg	alto	2025-10-08 10:00:00	320.00	50	8	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	6
82	Helado con galleta	Helado con galleta dulce.	https://gessenapp.co/images/platillos/helado_galleta.jpg	alto	2025-07-26 10:00:00	250.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	6
72	Postre de banano con leche condensada	Postre dulce de banano con leche condensada.	https://gessenapp.co/images/platillos/postre_banano.jpg	alto	2026-03-25 10:00:00	300.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	6
60	Quinoa dulce con canela	Quinoa cocida con canela y un toque de frutas.	https://gessenapp.co/images/platillos/quinoa_dulce_canela.jpg	medio	2025-08-20 10:00:00	280.00	15	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
59	Tazón de yogur con frutas mixtas	Yogur natural con frutas mixtas de temporada.	https://gessenapp.co/images/platillos/yogur_frutas_mixtas.jpg	medio	2025-12-14 10:00:00	290.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
73	Batido azucarado de frutas	Batido de frutas con azúcar añadida.	https://gessenapp.co/images/platillos/batido_azucarado.jpg	alto	2025-10-16 10:00:00	280.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
4	Omelette de espinaca	Omelette ligero con espinaca, perfecto para desayuno o merienda baja en carbohidratos.	https://gessenapp.co/images/platillos/omelette_espinaca.jpg	bajo	2025-10-24 10:00:00	250.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
55	Pan integral con queso y tomate	Pan integral tostado con queso bajo grasa y tomate.	https://gessenapp.co/images/platillos/pan_queso_tomate.jpg	medio	2025-12-29 10:00:00	260.00	8	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
54	Avena con papaya	Avena cocida con trozos de papaya fresca.	https://gessenapp.co/images/platillos/avena_papaya.jpg	medio	2025-10-28 10:00:00	270.00	8	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
50	Batido de yogur con banano	Batido de yogur natural con banano maduro.	https://gessenapp.co/images/platillos/batido_yogur_banano.jpg	medio	2025-08-20 10:00:00	300.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
44	Yogur con almendras	Yogur natural con almendras y un toque de canela.	https://gessenapp.co/images/platillos/yogur_almendras.jpg	bajo	2025-04-02 10:00:00	260.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
19	Ensalada de huevo y espinaca	Ensalada de huevo duro con espinaca fresca.	https://gessenapp.co/images/platillos/ensalada_huevo_espinaca.jpg	bajo	2025-04-24 10:00:00	280.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
84	Arroz blanco con frijoles	Arroz blanco con frijoles tradicionales.	https://gessenapp.co/images/platillos/arroz_frijoles.jpg	alto	2025-10-20 10:00:00	430.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
80	Hamburguesa con pan blanco	Hamburguesa clásica con pan blanco.	https://gessenapp.co/images/platillos/hamburguesa_pan_blanco.jpg	alto	2025-10-04 10:00:00	450.00	20	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
75	Puré de papa con carne	Puré de papa con carne molida.	https://gessenapp.co/images/platillos/pure_papa_carne.jpg	alto	2025-08-06 10:00:00	420.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
62	Wrap integral de atún	Wrap integral relleno de atún y vegetales.	https://gessenapp.co/images/platillos/wrap_atun.jpg	medio	2026-03-01 10:00:00	310.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
61	Batata asada con pollo	Batata asada acompañada de pollo a la plancha.	https://gessenapp.co/images/platillos/batata_pollo.jpg	medio	2026-01-29 10:00:00	400.00	35	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
58	Frijoles con arepa pequeña	Frijoles guisados con arepa integral pequeña.	https://gessenapp.co/images/platillos/frijoles_arepa.jpg	medio	2026-03-21 10:00:00	390.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
8	Lentejas guisadas ligeras	Lentejas cocidas con vegetales, alta en fibra y proteína vegetal.	https://gessenapp.co/images/platillos/lentejas_guisadas.jpg	bajo	2025-09-28 10:00:00	420.00	35	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
7	Pollo a la plancha con pepino y tomate	Pechuga de pollo a la plancha con ensalada fresca de pepino y tomate.	https://gessenapp.co/images/platillos/pollo_pepino_tomate.jpg	bajo	2025-08-07 10:00:00	380.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
5	Pescado blanco con ensalada fresca	Pescado blanco a la plancha con ensalada mixta, muy bajo en índice glucémico.	https://gessenapp.co/images/platillos/pescado_ensalada.jpg	bajo	2025-07-05 10:00:00	320.00	18	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
3	Tazón de quinoa y vegetales	Quinoa integral con vegetales frescos, alto en fibra y proteína vegetal.	https://gessenapp.co/images/platillos/quinoa_vegetales.jpg	bajo	2025-08-31 10:00:00	400.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
56	Pollo con pasta integral	Pollo a la plancha con pasta integral y salsa ligera.	https://gessenapp.co/images/platillos/pollo_pasta_integral.jpg	medio	2025-09-26 10:00:00	410.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
53	Garbanzos con batata	Garbanzos guisados con batata asada.	https://gessenapp.co/images/platillos/garbanzos_batata.jpg	medio	2025-10-27 10:00:00	390.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
52	Sandwich integral de pollo	Sandwich de pan integral con pollo y vegetales.	https://gessenapp.co/images/platillos/sandwich_pollo.jpg	medio	2025-04-24 10:00:00	320.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
51	Bowl de arroz integral y salmón	Arroz integral con salmón y vegetales.	https://gessenapp.co/images/platillos/bowl_arroz_salmon.jpg	medio	2025-09-06 10:00:00	410.00	22	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
47	Pasta integral con atún	Pasta integral con atún y salsa ligera.	https://gessenapp.co/images/platillos/pasta_integral_atun.jpg	medio	2025-10-06 10:00:00	400.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
71	Pan blanco con mermelada	Pan blanco tostado con mermelada.	https://gessenapp.co/images/platillos/pan_mermelada.jpg	alto	2025-05-19 10:00:00	220.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
42	Avena cocida con canela y fresas	Avena cocida con canela y fresas frescas.	https://gessenapp.co/images/platillos/avena_canela_fresas.jpg	bajo	2025-05-11 10:00:00	270.00	8	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
41	Tostadas integrales con aguacate y huevo	Tostadas de pan integral con aguacate y huevo.	https://gessenapp.co/images/platillos/tostadas_aguacate_huevo.jpg	bajo	2025-07-29 10:00:00	290.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
36	Huevos con espinaca y queso bajo grasa	Huevos revueltos con espinaca y queso bajo en grasa.	https://gessenapp.co/images/platillos/huevos_espinaca_queso.jpg	bajo	2025-07-12 10:00:00	280.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
29	Huevos revueltos con aguacate	Huevos revueltos acompañados de aguacate.	https://gessenapp.co/images/platillos/huevos_aguacate.jpg	bajo	2025-09-27 10:00:00	270.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
23	Yogur con nueces y mora	Yogur natural con nueces y moras frescas.	https://gessenapp.co/images/platillos/yogur_nueces_mora.jpg	bajo	2025-08-30 10:00:00	290.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
22	Avena nocturna sin azúcar	Avena preparada la noche anterior con canela y frutas.	https://gessenapp.co/images/platillos/avena_nocturna.jpg	bajo	2025-12-04 10:00:00	280.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
46	Arroz integral con pollo	Arroz integral con pollo y vegetales en porción controlada.	https://gessenapp.co/images/platillos/arroz_integral_pollo.jpg	medio	2025-10-12 10:00:00	420.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
45	Ensalada de quinoa y atún	Quinoa con atún y vegetales frescos.	https://gessenapp.co/images/platillos/ensalada_quinoa_atun.jpg	bajo	2025-03-29 10:00:00	370.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
43	Lentejas con espinaca	Lentejas guisadas con espinaca fresca.	https://gessenapp.co/images/platillos/lentejas_espinaca.jpg	bajo	2025-05-16 10:00:00	380.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
40	Pollo al horno con brócoli	Pollo al horno acompañado de brócoli al vapor.	https://gessenapp.co/images/platillos/pollo_brocoli_horno.jpg	bajo	2025-11-01 10:00:00	390.00	35	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
38	Ensalada de garbanzos	Ensalada fresca y proteica de garbanzos.	https://gessenapp.co/images/platillos/ensalada_garbanzos.jpg	bajo	2025-06-17 10:00:00	340.00	12	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
37	Bowl verde con pollo	Bowl de vegetales verdes con pollo a la plancha.	https://gessenapp.co/images/platillos/bowl_verde_pollo.jpg	bajo	2025-07-14 10:00:00	360.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
32	Pollo con arroz integral porción ligera	Pollo a la plancha con arroz integral en porción controlada.	https://gessenapp.co/images/platillos/pollo_arroz_integral.jpg	bajo	2025-08-04 10:00:00	380.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
31	Ensalada de atún y pepino	Ensalada fresca de atún con pepino y tomate.	https://gessenapp.co/images/platillos/ensalada_atun_pepino.jpg	bajo	2025-10-31 10:00:00	310.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
28	Tazón proteico de lentejas	Lentejas con vegetales y proteína magra.	https://gessenapp.co/images/platillos/tazon_lentejas.jpg	bajo	2026-01-31 10:00:00	410.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
27	Pollo con verduras al horno	Pollo al horno con vegetales variados.	https://gessenapp.co/images/platillos/pollo_verduras_horno.jpg	bajo	2025-10-13 10:00:00	400.00	35	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
25	Quinoa con garbanzos	Quinoa con garbanzos y vegetales frescos.	https://gessenapp.co/images/platillos/quinoa_garbanzos.jpg	bajo	2026-01-27 10:00:00	390.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
65	Arepa integral con queso bajo grasa	Arepa integral con queso bajo en grasa.	https://gessenapp.co/images/platillos/arepa_queso.jpg	medio	2026-03-24 10:00:00	270.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
86	Croissant con chocolate	Croissant relleno de chocolate.	https://gessenapp.co/images/platillos/croissant_chocolate.jpg	alto	2026-03-18 10:00:00	280.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
77	Pancakes con miel	Pancakes tradicionales con miel.	https://gessenapp.co/images/platillos/pancakes_miel.jpg	alto	2025-06-08 10:00:00	320.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
76	Cereal azucarado con leche	Cereal azucarado con leche.	https://gessenapp.co/images/platillos/cereal_azucarado.jpg	alto	2026-03-18 10:00:00	250.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
70	Arepa blanca con queso	Arepa tradicional de maíz blanco con queso.	https://gessenapp.co/images/platillos/arepa_blanca_queso.jpg	alto	2025-07-04 10:00:00	280.00	10	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
67	Arroz integral con huevo	Arroz integral con huevo revuelto y vegetales.	https://gessenapp.co/images/platillos/arroz_huevo.jpg	medio	2026-01-11 10:00:00	320.00	15	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
66	Avena con pera	Avena cocida con pera fresca y canela.	https://gessenapp.co/images/platillos/avena_pera.jpg	medio	2025-07-24 10:00:00	260.00	8	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
74	Arroz con pollo estilo casero	Arroz con pollo tradicional colombiano.	https://gessenapp.co/images/platillos/arroz_pollo_casero.jpg	alto	2026-03-05 10:00:00	450.00	40	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
68	Arroz blanco con papa	Arroz blanco con papa, plato tradicional alto en carbohidratos.	https://gessenapp.co/images/platillos/arroz_papa.jpg	alto	2025-11-28 10:00:00	450.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
21	Pollo con batata asada	Pollo a la plancha con batata asada.	https://gessenapp.co/images/platillos/pollo_batata.jpg	bajo	2026-01-31 10:00:00	420.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
16	Wrap integral de pollo	Wrap de tortilla integral relleno de pollo y vegetales.	https://gessenapp.co/images/platillos/wrap_pollo.jpg	bajo	2025-09-05 10:00:00	320.00	15	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
14	Pechuga con ensalada verde	Pechuga de pollo a la plancha con ensalada verde mixta.	https://gessenapp.co/images/platillos/pechuga_ensalada_verde.jpg	bajo	2025-06-25 10:00:00	360.00	18	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
12	Quinoa con pollo y espinaca	Quinoa integral con pollo y espinaca salteada.	https://gessenapp.co/images/platillos/quinoa_pollo_espinaca.jpg	bajo	2025-06-16 10:00:00	410.00	22	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
11	Ensalada mediterránea con atún	Ensalada fresca con atún, aceitunas y vegetales mediterráneos.	https://gessenapp.co/images/platillos/ensalada_atun.jpg	bajo	2025-03-30 10:00:00	320.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	2
35	Crema de zanahoria ligera	Crema ligera de zanahoria sin lácteos.	https://gessenapp.co/images/platillos/crema_zanahoria.jpg	bajo	2025-12-29 10:00:00	290.00	30	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
30	Sopa de vegetales y pollo	Sopa ligera de vegetales con pollo desmechado.	https://gessenapp.co/images/platillos/sopa_vegetales_pollo.jpg	bajo	2025-04-06 10:00:00	320.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
26	Ensalada tibia de salmón	Ensalada tibia con salmón y vegetales.	https://gessenapp.co/images/platillos/ensalada_tibia_salmon.jpg	bajo	2026-02-24 10:00:00	330.00	15	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
24	Tofu con brócoli y zanahoria	Tofu salteado con brócoli y zanahoria.	https://gessenapp.co/images/platillos/tofu_brocoli_zanahoria.jpg	bajo	2025-06-09 10:00:00	360.00	18	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
48	Arepa integral con huevo	Arepa de maíz integral con huevo revuelto.	https://images.cookforyourlife.org/wp-content/uploads/2015/08/Chicken-avocado-salad-stock.png	medio	2025-06-18 10:00:00	280.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
96	Tamal tradicional	Tamal colombiano tradicional.	https://gessenapp.co/images/platillos/tamal_tradicional.jpg	alto	2025-08-03 10:00:00	350.00	60	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
94	Pan blanco con mantequilla	Pan blanco tostado con mantequilla.	https://gessenapp.co/images/platillos/pan_mantequilla.jpg	alto	2025-10-23 10:00:00	240.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
90	Waffles con sirope	Waffles con sirope de maple.	https://gessenapp.co/images/platillos/waffles_sirope.jpg	alto	2025-09-23 10:00:00	320.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
87	Pan dulce con café	Pan dulce tradicional con café.	https://gessenapp.co/images/platillos/pan_dulce.jpg	alto	2026-01-21 10:00:00	220.00	5	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	1
1	Ensalada de pollo con aguacate	Platillo fresco y proteico con aguacate, ideal para mantener estable la glucosa durante el día.	https://images.cookforyourlife.org/wp-content/uploads/2015/08/Chicken-avocado-salad-stock.png	bajo	2025-11-04 10:00:00	350.00	15	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n2.\n3.\n4.	t	2
91	Canelones con salsa cremosa	Canelones rellenos con salsa blanca.	https://gessenapp.co/images/platillos/canelones_cremosos.jpg	alto	2025-07-05 10:00:00	450.00	40	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
49	Sopa de frijoles con arroz	Sopa de frijoles con un poco de arroz integral.	https://gessenapp.co/images/platillos/sopa_frijoles_arroz.jpg	medio	2025-05-26 10:00:00	380.00	40	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
39	Salmón con vegetales salteados	Salmón al horno con vegetales salteados.	https://gessenapp.co/images/platillos/salmon_verduras_salteadas.jpg	bajo	2026-01-12 10:00:00	320.00	22	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
34	Quinoa con tofu y pimentón	Quinoa con tofu salteado y pimentón.	https://gessenapp.co/images/platillos/quinoa_tofu_pimenton.jpg	bajo	2025-05-21 10:00:00	370.00	18	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
33	Pescado al limón con ensalada	Pescado blanco al limón con ensalada fresca.	https://gessenapp.co/images/platillos/pescado_limón_ensalada.jpg	bajo	2025-07-08 10:00:00	310.00	20	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
81	Lasaña clásica	Lasaña tradicional con carne y queso.	https://gessenapp.co/images/platillos/lasana_clasica.jpg	alto	2025-06-13 10:00:00	480.00	45	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
79	Pizza individual tradicional	Pizza individual con masa tradicional.	https://gessenapp.co/images/platillos/pizza_tradicional.jpg	alto	2025-11-16 10:00:00	400.00	25	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
69	Pasta cremosa tradicional	Pasta con salsa cremosa, plato alto en carga glucémica.	https://gessenapp.co/images/platillos/pasta_cremosa.jpg	alto	2026-01-13 10:00:00	420.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
64	Sopa de lentejas con papa	Sopa de lentejas con trozos de papa.	https://gessenapp.co/images/platillos/sopa_lentejas_papa.jpg	medio	2026-01-05 10:00:00	360.00	35	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
63	Pasta integral con vegetales	Pasta integral salteada con vegetales frescos.	https://gessenapp.co/images/platillos/pasta_integral_vegetales.jpg	medio	2026-02-08 10:00:00	380.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
57	Arroz integral con verduras y tofu	Arroz integral salteado con tofu y verduras.	https://gessenapp.co/images/platillos/arroz_tofu_verduras.jpg	medio	2026-03-05 10:00:00	380.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
20	Pescado con puré de coliflor	Pescado blanco con puré de coliflor bajo en carbohidratos.	https://gessenapp.co/images/platillos/pescado_pure_coliflor.jpg	bajo	2025-07-01 10:00:00	310.00	25	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
18	Sopa de lentejas casera	Sopa ligera de lentejas con vegetales.	https://gessenapp.co/images/platillos/sopa_lentejas.jpg	bajo	2025-05-21 10:00:00	350.00	40	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
17	Bowl de salmón y aguacate	Bowl fresco con salmón, aguacate y vegetales.	https://gessenapp.co/images/platillos/bowl_salmon_aguacate.jpg	bajo	2025-09-02 10:00:00	340.00	12	1	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
15	Garbanzos con verduras salteadas	Garbanzos con verduras al wok, alto en fibra.	https://gessenapp.co/images/platillos/garbanzos_verduras.jpg	bajo	2025-09-02 10:00:00	380.00	20	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
10	Crema de brócoli sin crema	Crema ligera de brócoli sin lácteos, ideal para control de glucosa.	https://gessenapp.co/images/platillos/crema_brocoli.jpg	bajo	2025-04-05 10:00:00	300.00	25	2	 Esta es una descripción de ejemplo de la preparación de las recetas.\nsteps:\n1.\n2.\n3.\n4.	t	3
\.


--
-- TOC entry 5229 (class 0 OID 16501)
-- Dependencies: 234
-- Data for Name: platillos_ingredientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platillos_ingredientes (id_platillo, id_ingrediente, cantidad, unidad, is_synthetic) FROM stdin;
1	2	80	g	t
1	14	80	g	t
1	15	50	g	t
1	18	30	g	t
1	20	120	g	t
2	3	40	g	t
2	15	30	g	t
2	14	40	g	t
2	18	60	g	t
2	21	150	g	t
2	38	50	g	t
3	9	120	g	t
3	13	120	g	t
3	15	50	g	t
3	32	100	g	t
3	37	60	g	t
4	5	120	g	t
4	14	50	g	t
4	17	120	g	t
4	20	60	g	t
4	31	180	g	t
5	2	80	g	t
5	14	50	g	t
5	18	50	g	t
5	21	30	g	t
5	36	100	g	t
5	38	200	g	t
6	4	60	g	t
6	7	80	g	t
6	18	180	g	t
6	39	30	g	t
7	2	100	g	t
7	14	60	g	t
7	17	200	g	t
7	18	50	g	t
7	21	200	g	t
7	40	60	g	t
8	1	100	g	t
8	13	200	g	t
8	14	60	g	t
8	21	50	g	t
9	6	80	g	t
9	14	100	g	t
9	15	50	g	t
9	19	50	g	t
9	40	150	g	t
10	14	50	g	t
10	15	30	g	t
10	18	200	g	t
10	19	120	g	t
10	20	200	g	t
11	4	60	g	t
11	14	100	g	t
11	37	100	g	t
11	40	50	g	t
12	3	40	g	t
12	13	30	g	t
12	14	30	g	t
12	22	120	g	t
12	38	150	g	t
13	5	150	g	t
13	15	40	g	t
13	19	30	g	t
13	30	80	g	t
13	39	30	g	t
14	2	30	g	t
14	11	40	g	t
14	14	100	g	t
14	28	60	g	t
14	31	60	g	t
14	39	120	g	t
15	3	30	g	t
15	14	100	g	t
15	16	30	g	t
15	23	120	g	t
15	32	40	g	t
16	2	150	g	t
16	15	80	g	t
16	17	40	g	t
16	20	180	g	t
16	26	120	g	t
17	4	100	g	t
17	7	180	g	t
17	15	120	g	t
17	17	200	g	t
17	21	60	g	t
17	38	180	g	t
18	4	180	g	t
18	9	200	g	t
18	16	180	g	t
18	37	200	g	t
18	40	200	g	t
19	2	80	g	t
19	9	100	g	t
19	10	40	g	t
19	13	40	g	t
19	15	120	g	t
19	16	180	g	t
20	1	200	g	t
20	21	200	g	t
20	39	200	g	t
20	40	40	g	t
21	3	50	g	t
21	17	80	g	t
21	19	120	g	t
21	23	50	g	t
21	30	200	g	t
22	2	80	g	t
22	6	150	g	t
22	13	40	g	t
22	16	60	g	t
22	20	50	g	t
23	4	180	g	t
23	14	50	g	t
23	24	40	g	t
23	32	80	g	t
23	40	180	g	t
24	2	100	g	t
24	13	150	g	t
24	16	180	g	t
24	22	120	g	t
24	30	40	g	t
25	4	30	g	t
25	6	120	g	t
25	10	30	g	t
25	39	50	g	t
25	40	200	g	t
26	3	30	g	t
26	12	60	g	t
26	19	80	g	t
26	21	200	g	t
26	33	80	g	t
26	39	80	g	t
27	3	40	g	t
27	19	150	g	t
27	36	40	g	t
27	37	100	g	t
27	39	80	g	t
28	6	50	g	t
28	14	30	g	t
28	16	150	g	t
28	17	80	g	t
28	21	80	g	t
28	26	120	g	t
29	2	180	g	t
29	16	50	g	t
29	18	80	g	t
29	20	40	g	t
29	23	150	g	t
30	6	40	g	t
30	14	150	g	t
30	17	30	g	t
30	18	200	g	t
30	19	200	g	t
30	22	200	g	t
31	5	120	g	t
31	10	200	g	t
31	17	150	g	t
31	19	50	g	t
31	21	100	g	t
32	3	200	g	t
32	13	50	g	t
32	14	150	g	t
32	40	40	g	t
33	4	30	g	t
33	13	30	g	t
33	20	60	g	t
33	34	60	g	t
33	40	100	g	t
34	1	50	g	t
34	17	100	g	t
34	22	150	g	t
34	31	100	g	t
34	40	60	g	t
35	6	100	g	t
35	15	30	g	t
35	16	120	g	t
35	21	80	g	t
36	5	180	g	t
36	13	80	g	t
36	23	150	g	t
36	40	50	g	t
37	6	180	g	t
37	17	200	g	t
37	23	40	g	t
37	39	80	g	t
38	5	150	g	t
38	16	100	g	t
38	18	60	g	t
38	20	30	g	t
38	32	30	g	t
39	1	80	g	t
39	14	80	g	t
39	15	150	g	t
39	22	30	g	t
39	39	40	g	t
40	3	100	g	t
40	8	150	g	t
40	11	200	g	t
40	14	80	g	t
40	19	40	g	t
40	21	100	g	t
41	4	40	g	t
41	9	120	g	t
41	19	200	g	t
41	38	150	g	t
42	5	30	g	t
42	13	40	g	t
42	15	80	g	t
42	23	100	g	t
42	30	30	g	t
43	2	100	g	t
43	16	120	g	t
43	18	50	g	t
43	20	180	g	t
43	39	200	g	t
44	4	60	g	t
44	14	40	g	t
44	15	150	g	t
44	22	150	g	t
44	25	200	g	t
45	6	200	g	t
45	8	200	g	t
45	13	80	g	t
45	14	180	g	t
45	20	180	g	t
46	2	40	g	t
46	18	60	g	t
46	24	30	g	t
46	29	100	g	t
46	31	100	g	t
46	38	80	g	t
47	2	120	g	t
47	14	60	g	t
47	15	150	g	t
47	19	60	g	t
47	21	100	g	t
48	1	150	g	t
48	33	30	g	t
48	36	180	g	t
48	38	30	g	t
48	40	180	g	t
49	6	180	g	t
49	14	120	g	t
49	15	120	g	t
49	17	200	g	t
49	36	60	g	t
50	2	60	g	t
50	15	60	g	t
50	19	60	g	t
50	21	200	g	t
50	36	80	g	t
50	39	100	g	t
51	5	180	g	t
51	14	80	g	t
51	16	120	g	t
51	18	30	g	t
51	27	180	g	t
51	36	40	g	t
52	2	180	g	t
52	10	30	g	t
52	17	100	g	t
52	19	150	g	t
52	40	40	g	t
53	6	30	g	t
53	13	80	g	t
53	17	60	g	t
53	36	200	g	t
53	37	150	g	t
54	5	50	g	t
54	14	180	g	t
54	16	40	g	t
54	21	120	g	t
54	39	30	g	t
55	2	200	g	t
55	13	180	g	t
55	15	100	g	t
55	16	40	g	t
55	20	100	g	t
55	37	180	g	t
56	5	100	g	t
56	9	80	g	t
56	19	60	g	t
56	21	200	g	t
56	22	180	g	t
56	39	150	g	t
57	5	40	g	t
57	8	120	g	t
57	16	80	g	t
57	22	180	g	t
57	40	80	g	t
58	4	100	g	t
58	13	180	g	t
58	15	40	g	t
58	38	40	g	t
59	2	40	g	t
59	9	50	g	t
59	16	30	g	t
59	19	150	g	t
59	28	100	g	t
59	37	30	g	t
60	4	120	g	t
60	19	40	g	t
60	22	180	g	t
60	33	30	g	t
60	38	200	g	t
61	5	150	g	t
61	14	120	g	t
61	17	120	g	t
61	20	30	g	t
61	33	150	g	t
62	5	180	g	t
62	15	180	g	t
62	17	50	g	t
62	24	40	g	t
62	37	30	g	t
63	2	50	g	t
63	10	60	g	t
63	16	200	g	t
63	17	80	g	t
63	18	60	g	t
64	5	40	g	t
64	9	60	g	t
64	20	200	g	t
64	38	150	g	t
64	39	100	g	t
65	2	200	g	t
65	18	50	g	t
65	30	200	g	t
65	37	200	g	t
65	38	100	g	t
66	2	150	g	t
66	16	150	g	t
66	17	150	g	t
66	19	100	g	t
66	37	80	g	t
67	5	180	g	t
67	16	30	g	t
67	17	200	g	t
67	20	200	g	t
67	33	120	g	t
68	5	150	g	t
68	15	180	g	t
68	16	180	g	t
68	19	40	g	t
68	36	120	g	t
68	38	100	g	t
69	6	50	g	t
69	10	150	g	t
69	15	100	g	t
69	21	30	g	t
69	37	60	g	t
69	39	150	g	t
70	3	100	g	t
70	19	40	g	t
70	30	180	g	t
70	38	80	g	t
71	5	100	g	t
71	14	150	g	t
71	15	150	g	t
71	21	200	g	t
71	26	30	g	t
71	39	180	g	t
72	2	100	g	t
72	15	40	g	t
72	16	150	g	t
72	20	150	g	t
72	40	150	g	t
73	2	50	g	t
73	10	80	g	t
73	15	50	g	t
73	20	180	g	t
73	40	120	g	t
74	2	50	g	t
74	10	200	g	t
74	23	180	g	t
74	30	80	g	t
74	38	50	g	t
74	40	100	g	t
75	1	150	g	t
75	7	200	g	t
75	16	200	g	t
75	21	30	g	t
75	31	180	g	t
75	39	180	g	t
76	1	60	g	t
76	17	150	g	t
76	19	120	g	t
76	20	100	g	t
76	34	200	g	t
76	39	200	g	t
77	1	180	g	t
77	17	30	g	t
77	20	120	g	t
77	34	60	g	t
77	39	100	g	t
78	5	60	g	t
78	18	120	g	t
78	19	180	g	t
78	32	180	g	t
78	37	150	g	t
79	3	50	g	t
79	15	40	g	t
79	19	60	g	t
79	21	180	g	t
79	33	120	g	t
80	4	40	g	t
80	10	40	g	t
80	13	80	g	t
80	14	60	g	t
80	36	100	g	t
81	6	30	g	t
81	17	60	g	t
81	21	180	g	t
81	32	80	g	t
81	39	60	g	t
82	6	80	g	t
82	13	120	g	t
82	14	100	g	t
82	18	120	g	t
82	21	120	g	t
83	5	200	g	t
83	17	60	g	t
83	22	150	g	t
83	32	120	g	t
83	39	200	g	t
84	3	150	g	t
84	14	120	g	t
84	18	200	g	t
84	31	150	g	t
84	37	60	g	t
85	1	60	g	t
85	14	100	g	t
85	15	120	g	t
85	37	100	g	t
85	38	180	g	t
86	6	60	g	t
86	14	200	g	t
86	18	80	g	t
86	21	50	g	t
86	31	60	g	t
87	2	40	g	t
87	16	150	g	t
87	20	200	g	t
87	32	30	g	t
87	40	180	g	t
88	5	60	g	t
88	10	200	g	t
88	17	50	g	t
88	18	30	g	t
88	38	180	g	t
89	6	30	g	t
89	9	30	g	t
89	15	60	g	t
89	23	120	g	t
89	38	200	g	t
90	2	120	g	t
90	17	60	g	t
90	21	120	g	t
90	32	100	g	t
90	38	100	g	t
91	2	50	g	t
91	14	50	g	t
91	17	150	g	t
91	23	30	g	t
92	4	120	g	t
92	17	40	g	t
92	31	50	g	t
92	40	30	g	t
93	3	30	g	t
93	16	120	g	t
93	17	40	g	t
93	18	100	g	t
93	22	200	g	t
94	3	40	g	t
94	18	120	g	t
94	33	200	g	t
94	37	80	g	t
94	40	150	g	t
95	4	100	g	t
95	9	100	g	t
95	19	80	g	t
95	22	80	g	t
95	40	200	g	t
96	6	50	g	t
96	21	60	g	t
96	30	80	g	t
96	39	40	g	t
96	40	60	g	t
\.


--
-- TOC entry 5249 (class 0 OID 16774)
-- Dependencies: 254
-- Data for Name: platillos_preferencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platillos_preferencias (id_platillo, id_preferencia) FROM stdin;
87	4
43	4
9	3
63	3
7	3
61	3
3	3
14	3
88	4
35	3
1	3
22	3
92	4
53	4
60	3
45	3
16	3
49	4
86	4
58	4
54	3
4	3
75	4
36	3
23	3
70	4
44	3
42	3
59	3
69	4
76	4
41	3
6	3
29	3
79	4
67	3
81	4
90	4
50	3
84	4
74	4
51	3
8	4
80	4
94	4
28	4
48	4
95	4
30	3
62	3
32	3
96	4
24	3
38	3
55	3
65	4
85	4
78	4
68	4
52	3
37	3
19	3
47	4
13	3
56	4
83	4
5	3
46	4
73	4
77	4
21	3
91	4
15	3
40	3
34	3
10	3
12	3
2	3
89	4
11	3
39	3
18	4
72	4
66	3
33	3
71	4
17	3
31	3
64	4
57	3
26	3
25	3
27	3
82	4
93	4
20	3
1	2
3	1
\.


--
-- TOC entry 5248 (class 0 OID 16757)
-- Dependencies: 253
-- Data for Name: platillos_sabores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platillos_sabores (id_platillo, id_sabor) FROM stdin;
87	1
83	1
60	1
89	1
72	1
93	1
82	1
27	2
26	2
25	2
20	2
62	2
30	2
28	2
80	2
8	2
2	2
74	2
64	2
84	2
18	2
81	2
34	2
10	2
79	2
12	2
69	2
31	2
51	2
57	2
33	2
17	2
11	2
39	2
75	2
5	2
21	2
45	2
91	2
49	2
1	2
58	2
53	2
56	2
40	2
46	2
15	2
47	2
16	2
7	2
38	2
68	2
24	2
9	2
63	2
32	2
52	2
35	2
37	2
14	2
61	2
3	2
43	2
9	3
4	3
6	3
13	3
19	3
22	3
23	3
29	3
36	3
41	3
42	3
44	3
48	3
50	3
54	3
55	3
59	3
65	3
66	3
67	3
70	3
71	3
73	3
76	3
77	3
78	3
85	3
86	3
88	3
90	3
92	3
94	3
95	3
96	3
\.


--
-- TOC entry 5247 (class 0 OID 16746)
-- Dependencies: 252
-- Data for Name: preferencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preferencias (id_preferencia, nombre, is_synthetic) FROM stdin;
1	Vegetariano	f
2	Con carne	f
3	Ligero	f
4	Tradicional	f
\.


--
-- TOC entry 5231 (class 0 OID 16532)
-- Dependencies: 236
-- Data for Name: recomendaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recomendaciones (id_recomendacion, id_enfermedad, id_platillo, score_ml, algoritmo, is_synthetic) FROM stdin;
\.


--
-- TOC entry 5217 (class 0 OID 16401)
-- Dependencies: 222
-- Data for Name: regiones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.regiones (id_region, nombre_region) FROM stdin;
1	Amazonía
2	Andina
3	Caribe
4	Insular
5	Orinoquía
6	Pacífica
\.


--
-- TOC entry 5215 (class 0 OID 16390)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre_rol) FROM stdin;
1	Administrador
2	Usuario
\.


--
-- TOC entry 5245 (class 0 OID 16734)
-- Dependencies: 250
-- Data for Name: sabores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sabores (id_sabor, nombre, is_synthetic) FROM stdin;
1	Dulce	f
2	Salado	f
3	Neutro	f
\.


--
-- TOC entry 5221 (class 0 OID 16424)
-- Dependencies: 226
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, apellido, email, password, genero, telefono, fecha_nacimiento, estatura, peso, id_departamento, id_rol, fecha_registro) FROM stdin;
1	Administrador	Admin	admin@gessenapp.salud.co	123456789	\N	\N	\N	\N	\N	\N	1	2026-04-17 16:24:13.780024
2	Kevin	Pantoja	alexanderpantoja32004@gmail.com	123456789	Masculino	3136910728	2004-07-03	172.00	64.00	32	2	2026-04-17 16:39:26.422002
\.


--
-- TOC entry 5224 (class 0 OID 16462)
-- Dependencies: 229
-- Data for Name: usuarios_enfermedades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios_enfermedades (id_usuario, id_enfermedad) FROM stdin;
\.


--
-- TOC entry 5241 (class 0 OID 16680)
-- Dependencies: 246
-- Data for Name: usuarios_favoritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios_favoritos (id_favorito, id_usuario, id_platillo, fecha_agregado, is_synthetic) FROM stdin;
\.


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 247
-- Name: categorias_platillo_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_platillo_id_categoria_seq', 12, true);


--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 223
-- Name: departamentos_id_departamento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departamentos_id_departamento_seq', 33, true);


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 227
-- Name: enfermedades_id_enfermedad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enfermedades_id_enfermedad_seq', 2, true);


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 237
-- Name: historial_consumo_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_consumo_id_historial_seq', 1, false);


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 241
-- Name: ingrediente_valores_nutricionales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingrediente_valores_nutricionales_id_seq', 280, true);


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 232
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredientes_id_ingrediente_seq', 1, false);


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 239
-- Name: nutrientes_id_nutriente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nutrientes_id_nutriente_seq', 7, true);


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 243
-- Name: platillo_calificaciones_id_calificacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platillo_calificaciones_id_calificacion_seq', 1, false);


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 230
-- Name: platillos_id_platillo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platillos_id_platillo_seq', 1, false);


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 251
-- Name: preferencias_id_preferencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preferencias_id_preferencia_seq', 8, true);


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 235
-- Name: recomendaciones_id_recomendacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recomendaciones_id_recomendacion_seq', 1, false);


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 221
-- Name: regiones_id_region_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regiones_id_region_seq', 6, true);


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 2, true);


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 249
-- Name: sabores_id_sabor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sabores_id_sabor_seq', 3, true);


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 245
-- Name: usuarios_favoritos_id_favorito_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_favoritos_id_favorito_seq', 1, false);


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 225
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 2, true);


--
-- TOC entry 5030 (class 2606 OID 16732)
-- Name: categorias_platillo categorias_platillo_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_platillo
    ADD CONSTRAINT categorias_platillo_nombre_key UNIQUE (nombre);


--
-- TOC entry 5032 (class 2606 OID 16730)
-- Name: categorias_platillo categorias_platillo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_platillo
    ADD CONSTRAINT categorias_platillo_pkey PRIMARY KEY (id_categoria);


--
-- TOC entry 4989 (class 2606 OID 16417)
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id_departamento);


--
-- TOC entry 4995 (class 2606 OID 16461)
-- Name: enfermedades enfermedades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enfermedades
    ADD CONSTRAINT enfermedades_pkey PRIMARY KEY (id_enfermedad);


--
-- TOC entry 5008 (class 2606 OID 16556)
-- Name: historial_consumo historial_consumo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_consumo
    ADD CONSTRAINT historial_consumo_pkey PRIMARY KEY (id_historial);


--
-- TOC entry 5016 (class 2606 OID 16627)
-- Name: ingrediente_valores_nutricionales ingrediente_valores_nutricionales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingrediente_valores_nutricionales
    ADD CONSTRAINT ingrediente_valores_nutricionales_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 16500)
-- Name: ingredientes ingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id_ingrediente);


--
-- TOC entry 5012 (class 2606 OID 16595)
-- Name: nutrientes nutrientes_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrientes
    ADD CONSTRAINT nutrientes_nombre_key UNIQUE (nombre);


--
-- TOC entry 5014 (class 2606 OID 16593)
-- Name: nutrientes nutrientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrientes
    ADD CONSTRAINT nutrientes_pkey PRIMARY KEY (id_nutriente);


--
-- TOC entry 5020 (class 2606 OID 16666)
-- Name: platillo_calificaciones platillo_calificaciones_id_usuario_id_platillo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillo_calificaciones
    ADD CONSTRAINT platillo_calificaciones_id_usuario_id_platillo_key UNIQUE (id_usuario, id_platillo);


--
-- TOC entry 5022 (class 2606 OID 16664)
-- Name: platillo_calificaciones platillo_calificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillo_calificaciones
    ADD CONSTRAINT platillo_calificaciones_pkey PRIMARY KEY (id_calificacion);


--
-- TOC entry 5004 (class 2606 OID 16507)
-- Name: platillos_ingredientes platillos_ingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_ingredientes
    ADD CONSTRAINT platillos_ingredientes_pkey PRIMARY KEY (id_platillo, id_ingrediente);


--
-- TOC entry 5000 (class 2606 OID 16491)
-- Name: platillos platillos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos
    ADD CONSTRAINT platillos_pkey PRIMARY KEY (id_platillo);


--
-- TOC entry 5044 (class 2606 OID 16780)
-- Name: platillos_preferencias platillos_preferencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_preferencias
    ADD CONSTRAINT platillos_preferencias_pkey PRIMARY KEY (id_platillo, id_preferencia);


--
-- TOC entry 5042 (class 2606 OID 16763)
-- Name: platillos_sabores platillos_sabores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_sabores
    ADD CONSTRAINT platillos_sabores_pkey PRIMARY KEY (id_platillo, id_sabor);


--
-- TOC entry 5038 (class 2606 OID 16756)
-- Name: preferencias preferencias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias
    ADD CONSTRAINT preferencias_nombre_key UNIQUE (nombre);


--
-- TOC entry 5040 (class 2606 OID 16754)
-- Name: preferencias preferencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias
    ADD CONSTRAINT preferencias_pkey PRIMARY KEY (id_preferencia);


--
-- TOC entry 5006 (class 2606 OID 16538)
-- Name: recomendaciones recomendaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recomendaciones
    ADD CONSTRAINT recomendaciones_pkey PRIMARY KEY (id_recomendacion);


--
-- TOC entry 4987 (class 2606 OID 16408)
-- Name: regiones regiones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regiones
    ADD CONSTRAINT regiones_pkey PRIMARY KEY (id_region);


--
-- TOC entry 4983 (class 2606 OID 16399)
-- Name: roles roles_nombre_rol_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_rol_key UNIQUE (nombre_rol);


--
-- TOC entry 4985 (class 2606 OID 16397)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 5034 (class 2606 OID 16744)
-- Name: sabores sabores_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_nombre_key UNIQUE (nombre);


--
-- TOC entry 5036 (class 2606 OID 16742)
-- Name: sabores sabores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_pkey PRIMARY KEY (id_sabor);


--
-- TOC entry 4991 (class 2606 OID 16440)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4997 (class 2606 OID 16468)
-- Name: usuarios_enfermedades usuarios_enfermedades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_enfermedades
    ADD CONSTRAINT usuarios_enfermedades_pkey PRIMARY KEY (id_usuario, id_enfermedad);


--
-- TOC entry 5026 (class 2606 OID 16691)
-- Name: usuarios_favoritos usuarios_favoritos_id_usuario_id_platillo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_favoritos
    ADD CONSTRAINT usuarios_favoritos_id_usuario_id_platillo_key UNIQUE (id_usuario, id_platillo);


--
-- TOC entry 5028 (class 2606 OID 16689)
-- Name: usuarios_favoritos usuarios_favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_favoritos
    ADD CONSTRAINT usuarios_favoritos_pkey PRIMARY KEY (id_favorito);


--
-- TOC entry 4993 (class 2606 OID 16438)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 5017 (class 1259 OID 16678)
-- Name: idx_calif_platillo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calif_platillo ON public.platillo_calificaciones USING btree (id_platillo);


--
-- TOC entry 5018 (class 1259 OID 16677)
-- Name: idx_calif_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calif_usuario ON public.platillo_calificaciones USING btree (id_usuario);


--
-- TOC entry 5023 (class 1259 OID 16703)
-- Name: idx_favoritos_platillo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favoritos_platillo ON public.usuarios_favoritos USING btree (id_platillo);


--
-- TOC entry 5024 (class 1259 OID 16702)
-- Name: idx_favoritos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favoritos_usuario ON public.usuarios_favoritos USING btree (id_usuario);


--
-- TOC entry 5009 (class 1259 OID 16709)
-- Name: idx_historial_mealtime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_mealtime ON public.historial_consumo USING btree (meal_time);


--
-- TOC entry 5010 (class 1259 OID 16708)
-- Name: idx_historial_usuario_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_usuario_fecha ON public.historial_consumo USING btree (id_usuario, fecha_consumo DESC);


--
-- TOC entry 4998 (class 1259 OID 16647)
-- Name: idx_platillos_nivel_glucemico; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_platillos_nivel_glucemico ON public.platillos USING btree (nivel_glucemico);


--
-- TOC entry 5045 (class 2606 OID 16418)
-- Name: departamentos departamentos_id_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_id_region_fkey FOREIGN KEY (id_region) REFERENCES public.regiones(id_region);


--
-- TOC entry 5055 (class 2606 OID 16562)
-- Name: historial_consumo historial_consumo_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_consumo
    ADD CONSTRAINT historial_consumo_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo);


--
-- TOC entry 5056 (class 2606 OID 16557)
-- Name: historial_consumo historial_consumo_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_consumo
    ADD CONSTRAINT historial_consumo_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5057 (class 2606 OID 16628)
-- Name: ingrediente_valores_nutricionales ingrediente_valores_nutricionales_id_ingrediente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingrediente_valores_nutricionales
    ADD CONSTRAINT ingrediente_valores_nutricionales_id_ingrediente_fkey FOREIGN KEY (id_ingrediente) REFERENCES public.ingredientes(id_ingrediente) ON DELETE CASCADE;


--
-- TOC entry 5058 (class 2606 OID 16633)
-- Name: ingrediente_valores_nutricionales ingrediente_valores_nutricionales_id_nutriente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingrediente_valores_nutricionales
    ADD CONSTRAINT ingrediente_valores_nutricionales_id_nutriente_fkey FOREIGN KEY (id_nutriente) REFERENCES public.nutrientes(id_nutriente);


--
-- TOC entry 5059 (class 2606 OID 16672)
-- Name: platillo_calificaciones platillo_calificaciones_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillo_calificaciones
    ADD CONSTRAINT platillo_calificaciones_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;


--
-- TOC entry 5060 (class 2606 OID 16667)
-- Name: platillo_calificaciones platillo_calificaciones_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillo_calificaciones
    ADD CONSTRAINT platillo_calificaciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5050 (class 2606 OID 16791)
-- Name: platillos platillos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos
    ADD CONSTRAINT platillos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias_platillo(id_categoria);


--
-- TOC entry 5051 (class 2606 OID 16513)
-- Name: platillos_ingredientes platillos_ingredientes_id_ingrediente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_ingredientes
    ADD CONSTRAINT platillos_ingredientes_id_ingrediente_fkey FOREIGN KEY (id_ingrediente) REFERENCES public.ingredientes(id_ingrediente);


--
-- TOC entry 5052 (class 2606 OID 16508)
-- Name: platillos_ingredientes platillos_ingredientes_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_ingredientes
    ADD CONSTRAINT platillos_ingredientes_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo);


--
-- TOC entry 5065 (class 2606 OID 16781)
-- Name: platillos_preferencias platillos_preferencias_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_preferencias
    ADD CONSTRAINT platillos_preferencias_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;


--
-- TOC entry 5066 (class 2606 OID 16786)
-- Name: platillos_preferencias platillos_preferencias_id_preferencia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_preferencias
    ADD CONSTRAINT platillos_preferencias_id_preferencia_fkey FOREIGN KEY (id_preferencia) REFERENCES public.preferencias(id_preferencia) ON DELETE CASCADE;


--
-- TOC entry 5063 (class 2606 OID 16764)
-- Name: platillos_sabores platillos_sabores_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_sabores
    ADD CONSTRAINT platillos_sabores_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;


--
-- TOC entry 5064 (class 2606 OID 16769)
-- Name: platillos_sabores platillos_sabores_id_sabor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platillos_sabores
    ADD CONSTRAINT platillos_sabores_id_sabor_fkey FOREIGN KEY (id_sabor) REFERENCES public.sabores(id_sabor) ON DELETE CASCADE;


--
-- TOC entry 5053 (class 2606 OID 16539)
-- Name: recomendaciones recomendaciones_id_enfermedad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recomendaciones
    ADD CONSTRAINT recomendaciones_id_enfermedad_fkey FOREIGN KEY (id_enfermedad) REFERENCES public.enfermedades(id_enfermedad);


--
-- TOC entry 5054 (class 2606 OID 16544)
-- Name: recomendaciones recomendaciones_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recomendaciones
    ADD CONSTRAINT recomendaciones_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo);


--
-- TOC entry 5048 (class 2606 OID 16474)
-- Name: usuarios_enfermedades usuarios_enfermedades_id_enfermedad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_enfermedades
    ADD CONSTRAINT usuarios_enfermedades_id_enfermedad_fkey FOREIGN KEY (id_enfermedad) REFERENCES public.enfermedades(id_enfermedad);


--
-- TOC entry 5049 (class 2606 OID 16469)
-- Name: usuarios_enfermedades usuarios_enfermedades_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_enfermedades
    ADD CONSTRAINT usuarios_enfermedades_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5061 (class 2606 OID 16697)
-- Name: usuarios_favoritos usuarios_favoritos_id_platillo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_favoritos
    ADD CONSTRAINT usuarios_favoritos_id_platillo_fkey FOREIGN KEY (id_platillo) REFERENCES public.platillos(id_platillo) ON DELETE CASCADE;


--
-- TOC entry 5062 (class 2606 OID 16692)
-- Name: usuarios_favoritos usuarios_favoritos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios_favoritos
    ADD CONSTRAINT usuarios_favoritos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5046 (class 2606 OID 16441)
-- Name: usuarios usuarios_id_departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_departamento_fkey FOREIGN KEY (id_departamento) REFERENCES public.departamentos(id_departamento);


--
-- TOC entry 5047 (class 2606 OID 16446)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


-- Completed on 2026-04-17 23:22:21

--
-- PostgreSQL database dump complete
--

\unrestrict aoSNegWQz063dAETBh71VrbtnSLhwEfDM8jhPG3YgaDYcfsthmFZBZGTDxcG2ch

