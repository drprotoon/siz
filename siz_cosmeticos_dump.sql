--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Debian 14.18-1.pgdg120+1)
-- Dumped by pg_dump version 14.18 (Debian 14.18-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id integer,
    session_id text,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total numeric(10,2) NOT NULL,
    shipping_address text NOT NULL,
    shipping_city text NOT NULL,
    shipping_state text NOT NULL,
    shipping_postal_code text NOT NULL,
    shipping_country text NOT NULL,
    shipping_method text,
    shipping_cost numeric(10,2),
    payment_method text,
    payment_id text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    sku text NOT NULL,
    weight numeric(6,2) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    category_id integer NOT NULL,
    images text[],
    ingredients text,
    how_to_use text,
    visible boolean DEFAULT true NOT NULL,
    featured boolean DEFAULT false,
    new_arrival boolean DEFAULT false,
    best_seller boolean DEFAULT false,
    rating numeric(3,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    rating integer NOT NULL,
    title text,
    comment text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    full_name text,
    address text,
    city text,
    state text,
    postal_code text,
    country text,
    phone text,
    role text DEFAULT 'customer'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wishlist_items OWNER TO postgres;

--
-- Name: wishlist_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wishlist_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wishlist_items_id_seq OWNER TO postgres;

--
-- Name: wishlist_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlist_items_id_seq OWNED BY public.wishlist_items.id;


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wishlist_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items ALTER COLUMN id SET DEFAULT nextval('public.wishlist_items_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cart_items (id, user_id, session_id, product_id, quantity, created_at) 
VALUES 
  (1, 2, NULL, 5, 3, '2025-05-12 04:25:12.555759'),


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, description, image_url) FROM stdin;
6	Skincare	skincare	Produtos para cuidados com a pele	https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80
7	Maquiagem	maquiagem	Produtos de maquiagem para todos os tipos de pele	https://images.unsplash.com/photo-1596704017248-eb02655de3e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80
8	Cabelos	cabelos	Produtos para cuidados com os cabelos	https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80
9	Corpo & Banho	corpo-banho	Produtos para cuidados com o corpo	https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80
10	Fragrâncias	fragrancias	Perfumes e fragrâncias para todos os gostos	https://images.unsplash.com/photo-1595425964072-537c688fe172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80
11	Kits	kits	Kits de produtos para cuidados completos	https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, price, name) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, status, total, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_method, shipping_cost, payment_method, payment_id, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, slug, description, price, compare_at_price, sku, weight, quantity, category_id, images, ingredients, how_to_use, visible, featured, new_arrival, best_seller, rating, review_count, created_at) FROM stdin;
25	Óleo Capilar Multifuncional	oleo-capilar-multifuncional	Óleo leve que nutre, dá brilho e protege os cabelos do calor sem pesar. Pode ser usado antes ou depois da modelagem.	79.90	\N	CAB003	100.00	40	8	{https://images.unsplash.com/photo-1662752375496-28f718bd96b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1829&q=80}	Ciclopentasiloxano, Dimeticona, Óleo de Argan, Óleo de Jojoba, Óleo de Coco, Vitamina E	Aplique algumas gotas no cabelo úmido ou seco, concentrando-se nas pontas. Evite a raiz se tiver cabelo oleoso.	t	f	f	f	0.0	0	2025-05-12 22:14:17.900549
34	Kit Wella Color Brilliance 1L	kit-wella-color-brilliance-1l	Kit para proteção da cor e hidratação, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.	633.70	699.90	WELLA-KIT-003	2500.00	15	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais, Filtro UV	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	t	t	f	0.0	0	2025-05-12 22:14:17.900549
35	Kit Wella Color Brilliance 250ml	kit-wella-color-brilliance-250ml	Kit para proteção da cor e hidratação, contendo Shampoo de 250ml e Máscara de 150ml.	228.80	249.90	WELLA-KIT-004	400.00	20	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais, Filtro UV	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
36	Kit Wella Fusion Reparação Intensa	kit-wella-fusion-reparacao-intensa	Kit para reparação intensa dos cabelos, contendo Shampoo de 1 litro e Máscara de 500ml.	585.80	629.90	WELLA-KIT-005	1500.00	10	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Aminoácidos, Óleos Essenciais	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
38	Óleo Oil Reflections 100ml	oleo-oil-reflections-100ml	Óleo para cabelos que proporciona brilho intenso e hidratação profunda.	179.90	\N	WELLA-OIL-001	100.00	25	8	{}	Óleo de Argan, Óleo de Macadâmia, Vitamina E, Silicones	Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
39	Óleo Oil Reflections 30ml	oleo-oil-reflections-30ml	Óleo para cabelos que proporciona brilho intenso e hidratação profunda.	76.90	\N	WELLA-OIL-002	30.00	30	8	{}	Óleo de Argan, Óleo de Macadâmia, Vitamina E, Silicones	Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
40	Óleo Oil Reflections Light 100ml	oleo-oil-reflections-light-100ml	Óleo leve para cabelos finos que proporciona brilho sem pesar.	179.90	\N	WELLA-OIL-003	100.00	25	8	{}	Óleo de Camélia, Óleo de Abacate, Vitamina E, Silicones Leves	Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho sem pesar.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
41	Óleo Oil Reflections Light 30ml	oleo-oil-reflections-light-30ml	Óleo leve para cabelos finos que proporciona brilho sem pesar.	76.90	\N	WELLA-OIL-004	30.00	30	8	{}	Óleo de Camélia, Óleo de Abacate, Vitamina E, Silicones Leves	Aplique algumas gotas nas pontas dos cabelos úmidos ou secos para controlar o frizz e adicionar brilho sem pesar.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
42	Kit Sebastian Penetraitt Wella 1L	kit-sebastian-penetraitt-wella-1l	Kit para cabelos danificados, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.	729.70	799.90	WELLA-KIT-007	2500.00	10	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Queratina, Óleos Essenciais	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	t	t	f	0.0	0	2025-05-12 22:14:17.900549
32	Kit Wella Nutri  Enrich Nutrição Profunda	wella-nutri-enrich	Kit Wella Nutri  Enrich\nNutrição Profunda\nShampoo de 1 litro 189.90\nCondicionador de 1  litro 189.90\nMáscara 500 gramas 243.90\n	621.00	721.00	WELLANUTRIENRICH	2500.00	100	3	{blob:http://localhost:5000/1510950c-fb3a-4e9d-bae1-19d77e2c9f33,blob:http://localhost:5000/dd1fc2c4-002c-4113-88a4-48cbe501ed23,blob:http://localhost:5000/fd609f0e-904a-4931-97c1-f304bb7d5453,blob:http://localhost:5000/81ea1f05-d530-4340-a176-d951a315e48a}	Kit Wella Nutri  Enrich\nNutrição Profunda\nShampoo de 1 litro 189.90\nCondicionador de 1  litro 189.90\nMáscara 500 gramas 243.90\n	Kit Wella Nutri  Enrich\nNutrição Profunda\nShampoo de 1 litro 189.90\nCondicionador de 1  litro 189.90\nMáscara 500 gramas 243.90\n	t	t	f	t	0.0	0	2025-05-12 22:14:17.900549
33	Kit Wella Nutri  Enrich	Kit-Wella-Nutri- Enrich	Kit Wella Nutri  Enrich\nNutrição Profunda\nShampoo de 1 litro 189.90\nCondicionador de 1  litro 189.90\nMáscara 500 gramas 243.90\n	621.00	721.00	DASDASD	2500.00	100	3	{blob:http://localhost:5000/b599a0a1-d4c4-4890-b2aa-495a7cee73de}	Kit Wella Nutri  Enrich	Kit Wella Nutri  Enrich	t	t	t	t	0.0	0	2025-05-12 22:14:17.900549
43	Kit Wella Hidratação e Luminosidade 250ml	kit-wella-hidratacao-luminosidade-250ml	Kit para hidratação e luminosidade dos cabelos, contendo Shampoo de 250ml, Condicionador de 200ml e Máscara de 150ml.	441.70	499.90	WELLA-KIT-008	600.00	20	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	f	t	f	0.0	0	2025-05-12 22:14:17.900549
44	Máscara Wella Oil Reflection 500ml	mascara-wella-oil-reflection-500ml	Máscara de tratamento intensivo que proporciona brilho e hidratação profunda aos cabelos.	309.90	\N	WELLA-MASK-001	500.00	15	8	{}	Água, Álcool Cetílico, Óleo de Argan, Óleo de Macadâmia, Queratina, Proteínas da Seda	Após lavar os cabelos com shampoo, aplique a máscara mecha por mecha, deixe agir por 5-10 minutos e enxágue abundantemente.	t	t	t	f	0.0	0	2025-05-12 22:14:17.900549
37	Kit Sebastian Wella Revitalizante 1L	kit-sebastian-wella-revitalizante-1l	Kit revitalizante para cabelos, contendo Shampoo de 1 litro, Condicionador de 1 litro e Máscara de 500ml.	999.70	1099.90	WELLA-KIT-006	2500.00	8	11	{}	Água, Lauril Sulfato de Sódio, Cocamidopropil Betaína, Proteínas, Vitaminas, Óleos Essenciais	Aplique o shampoo nos cabelos molhados, massageie e enxágue. Em seguida, aplique o condicionador, deixe agir por 3 minutos e enxágue. Para tratamento intensivo, aplique a máscara após o shampoo, deixe agir por 5-10 minutos e enxágue.	t	t	t	f	0.0	0	2025-05-12 22:14:17.900549
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, product_id, user_id, rating, title, comment, created_at) FROM stdin;
6	17	2	5	Excelente produto!	Este creme é incrível! Minha pele nunca esteve tão hidratada. Recomendo muito!	2025-05-12 22:14:17.931102
7	17	2	4	Muito bom	Ótimo produto, mas achei o preço um pouco alto. De qualquer forma, vale a pena pelo resultado.	2025-05-12 22:14:17.931102
8	18	2	5	O melhor sérum que já usei	Estou usando há 2 semanas e já notei uma diferença significativa na minha pele. As manchas estão mais claras e a pele mais luminosa.	2025-05-12 22:14:17.931102
9	20	2	5	Base perfeita	Cobertura incrível e realmente dura o dia todo. Não transfere para as roupas e tem acabamento natural.	2025-05-12 22:14:17.931102
10	24	2	4	Bom esfoliante	Deixa a pele muito macia, mas o cheiro poderia ser mais agradável.	2025-05-12 22:14:17.931102
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, email, full_name, address, city, state, postal_code, country, phone, role, created_at) FROM stdin;
1	admin	$2b$10$DTZP5DrAGgjRYMKct2j./uj0KpZLn0uj18aFDbk4cA64M98G8.ID.	admin@beautyessence.com	Administrador	Av Paulista, 1000	São Paulo	SP	01310-100	Brasil	11987654321	admin	2025-05-12 04:21:22.701539
2	teste	$2b$10$DTZP5DrAGgjRYMKct2j./uj0KpZLn0uj18aFDbk4cA64M98G8.ID.	teste@exemplo.com	Usuário Teste	Rua Exemplo, 123	Rio de Janeiro	RJ	22222-222	Brasil	21987654321	customer	2025-05-12 04:21:22.709626
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist_items (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 1, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 44, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: wishlist_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlist_items_id_seq', 1, false);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

