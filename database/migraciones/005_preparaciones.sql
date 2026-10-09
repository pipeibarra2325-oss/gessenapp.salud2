-- 005: pasos de preparación de los 96 platillos sintéticos.
-- Antes todos tenían el texto de ejemplo "Esta es una descripción de ejemplo de la preparación...".
-- Los pasos se redactaron a partir de los ingredientes de cada receta (migración 004); un paso por línea.
-- Idempotente: puede ejecutarse más de una vez.
BEGIN;
UPDATE platillos SET preparacion = 'Cocinar la pechuga de pollo a la plancha y cortarla en tiras.
Lavar la lechuga, el tomate y el pepino; picarlos en trozos.
Cortar el aguacate en cubos y mezclar con las verduras y el pollo.
Aliñar con el aceite de oliva y el jugo de limón al servir.' WHERE nombre_platillo = 'Ensalada de pollo con aguacate';
UPDATE platillos SET preparacion = 'Sazonar el salmón con el ajo picado y el jugo de limón.
Cocinar el salmón a la plancha o al horno durante 12 a 15 minutos.
Cocinar el brócoli al vapor durante 5 minutos.
Servir y agregar el aceite de oliva sobre el brócoli.' WHERE nombre_platillo = 'Salmón con brócoli al vapor';
UPDATE platillos SET preparacion = 'Lavar la quinoa y cocinarla en agua durante 15 minutos.
Saltear la zanahoria, el pimentón y el brócoli con el aceite de oliva.
Agregar la espinaca al final para que se ablande.
Servir la quinoa con los vegetales encima.' WHERE nombre_platillo = 'Tazón de quinoa y vegetales';
UPDATE platillos SET preparacion = 'Batir los huevos.
Sofreír la cebolla y el tomate con el aceite en una sartén antiadherente.
Agregar la espinaca y luego los huevos; cocinar a fuego bajo.
Doblar el omelette y servir.' WHERE nombre_platillo = 'Omelette de espinaca';
UPDATE platillos SET preparacion = 'Sazonar el pescado con limón y cocinarlo a la plancha 4 minutos por lado.
Lavar y picar la lechuga, el tomate y el pepino.
Aliñar la ensalada con el aceite de oliva y servir junto al pescado.' WHERE nombre_platillo = 'Pescado blanco con ensalada fresca';
UPDATE platillos SET preparacion = 'Lavar y picar las fresas.
Servir el yogur natural sin azúcar.
Agregar las fresas y las semillas de chía por encima.' WHERE nombre_platillo = 'Yogur natural con chía y fresas';
UPDATE platillos SET preparacion = 'Sazonar el pollo con limón y cocinarlo a la plancha hasta que esté bien cocido.
Cortar el pepino y el tomate en rodajas.
Servir el pollo con la ensalada y el aceite de oliva.' WHERE nombre_platillo = 'Pollo a la plancha con pepino y tomate';
UPDATE platillos SET preparacion = 'Lavar las lentejas y cocinarlas en agua hasta que ablanden.
Hacer un sofrito con la cebolla, el ajo, el tomate y el aceite.
Agregar el sofrito y la zanahoria picada a las lentejas; cocinar 10 minutos más.' WHERE nombre_platillo = 'Lentejas guisadas ligeras';
UPDATE platillos SET preparacion = 'Cortar el tofu en cubos y dorarlo con el aceite de oliva.
Agregar la cebolla, el pimentón, la zanahoria y el brócoli picados.
Saltear a fuego alto de 5 a 7 minutos y servir.' WHERE nombre_platillo = 'Tofu salteado con verduras';
UPDATE platillos SET preparacion = 'Cocinar el brócoli, la papa, la cebolla y el ajo en poca agua durante 15 minutos.
Licuar con la leche descremada hasta obtener una crema.
Calentar de nuevo sin dejar hervir y servir.' WHERE nombre_platillo = 'Crema de brócoli sin crema';
UPDATE platillos SET preparacion = 'Lavar y picar la lechuga, el tomate, el pepino y el pimentón.
Escurrir el atún y agregarlo a las verduras.
Aliñar con el aceite de oliva y servir.' WHERE nombre_platillo = 'Ensalada mediterránea con atún';
UPDATE platillos SET preparacion = 'Cocinar la quinoa en agua durante 15 minutos.
Cocinar el pollo a la plancha y cortarlo en cubos.
Saltear la cebolla y la espinaca con el aceite; mezclar con la quinoa y el pollo.' WHERE nombre_platillo = 'Quinoa con pollo y espinaca';
UPDATE platillos SET preparacion = 'Batir los huevos.
Sofreír la cebolla y el tomate picados con el aceite.
Agregar los huevos y cocinar la tortilla por ambos lados.' WHERE nombre_platillo = 'Tortilla de huevo con tomate';
UPDATE platillos SET preparacion = 'Cocinar la pechuga a la plancha hasta que esté bien cocida.
Lavar y picar la lechuga, la espinaca y el pepino.
Servir la pechuga con la ensalada aliñada con el aceite de oliva.' WHERE nombre_platillo = 'Pechuga con ensalada verde';
UPDATE platillos SET preparacion = 'Cocinar los garbanzos previamente remojados hasta que ablanden.
Saltear la cebolla, el pimentón y la zanahoria con el aceite.
Agregar los garbanzos y la espinaca; cocinar 5 minutos más.' WHERE nombre_platillo = 'Garbanzos con verduras salteadas';
UPDATE platillos SET preparacion = 'Cocinar el pollo a la plancha y cortarlo en tiras.
Calentar la tortilla o pan integral.
Rellenar con el pollo, la lechuga, el tomate y el aguacate; enrollar.' WHERE nombre_platillo = 'Wrap integral de pollo';
UPDATE platillos SET preparacion = 'Cocinar el arroz integral.
Cocinar el salmón a la plancha y cortarlo en trozos.
Servir el arroz con el salmón, el aguacate, el pepino y la espinaca.' WHERE nombre_platillo = 'Bowl de salmón y aguacate';
UPDATE platillos SET preparacion = 'Cocinar las lentejas con agua, la papa y la zanahoria picadas.
Agregar un sofrito de cebolla, ajo y tomate.
Cocinar a fuego bajo 15 minutos y servir caliente.' WHERE nombre_platillo = 'Sopa de lentejas casera';
UPDATE platillos SET preparacion = 'Cocinar los huevos en agua durante 10 minutos, pelarlos y picarlos.
Lavar la espinaca y picar el tomate y el aguacate.
Mezclar todo y aliñar con el aceite de oliva.' WHERE nombre_platillo = 'Ensalada de huevo y espinaca';
UPDATE platillos SET preparacion = 'Cocinar la coliflor en agua hasta que esté blanda.
Hacer un puré con la coliflor, el ajo y la leche descremada.
Cocinar el pescado a la plancha con el aceite y servir sobre el puré.' WHERE nombre_platillo = 'Pescado con puré de coliflor';
UPDATE platillos SET preparacion = 'Cortar la batata en cubos y asarla en el horno durante 25 minutos.
Cocinar el pollo a la plancha.
Cocinar el brócoli al vapor y servir todo con el aceite de oliva.' WHERE nombre_platillo = 'Pollo con batata asada';
UPDATE platillos SET preparacion = 'Mezclar la avena, la leche descremada, la chía y la canela en un frasco.
Refrigerar durante la noche.
Servir en la mañana con las fresas picadas.' WHERE nombre_platillo = 'Avena nocturna sin azúcar';
UPDATE platillos SET preparacion = 'Lavar las moras.
Servir el yogur natural sin azúcar.
Agregar las moras y las nueces troceadas.' WHERE nombre_platillo = 'Yogur con nueces y mora';
UPDATE platillos SET preparacion = 'Cortar el tofu en cubos y dorarlo con el aceite y el ajo.
Agregar la zanahoria en rodajas y el brócoli.
Saltear 5 minutos y servir.' WHERE nombre_platillo = 'Tofu con brócoli y zanahoria';
UPDATE platillos SET preparacion = 'Cocinar la quinoa en agua durante 15 minutos.
Saltear la cebolla, el pimentón y el tomate con el aceite.
Agregar los garbanzos cocidos y la quinoa; mezclar y servir.' WHERE nombre_platillo = 'Quinoa con garbanzos';
UPDATE platillos SET preparacion = 'Cocinar el salmón a la plancha y desmenuzarlo.
Lavar la espinaca y la lechuga; picar el tomate.
Mezclar con el salmón tibio y aliñar con limón y aceite de oliva.' WHERE nombre_platillo = 'Ensalada tibia de salmón';
UPDATE platillos SET preparacion = 'Cortar el pollo y las verduras en trozos.
Mezclar con el aceite de oliva y sazonar.
Hornear a 200 °C durante 30 minutos.' WHERE nombre_platillo = 'Pollo con verduras al horno';
UPDATE platillos SET preparacion = 'Cocinar las lentejas y el huevo.
Picar el tomate, la espinaca y el aguacate.
Servir las lentejas con las verduras y el huevo en rodajas.' WHERE nombre_platillo = 'Tazón proteico de lentejas';
UPDATE platillos SET preparacion = 'Sofreír la cebolla y el tomate picados.
Agregar los huevos batidos y revolver a fuego bajo.
Servir con el aguacate en rodajas.' WHERE nombre_platillo = 'Huevos revueltos con aguacate';
UPDATE platillos SET preparacion = 'Cocinar el pollo en agua durante 20 minutos y desmenuzarlo.
Agregar la papa, la zanahoria, la cebolla y el brócoli picados.
Cocinar 15 minutos más y agregar la espinaca al final.' WHERE nombre_platillo = 'Sopa de vegetales y pollo';
UPDATE platillos SET preparacion = 'Cortar el pepino y el tomate en cubos; picar la lechuga.
Escurrir el atún y mezclar con las verduras.
Aliñar con limón y aceite de oliva.' WHERE nombre_platillo = 'Ensalada de atún y pepino';
UPDATE platillos SET preparacion = 'Cocinar el arroz integral.
Cocinar el pollo a la plancha.
Cocinar el brócoli y la zanahoria al vapor y servir en una porción moderada.' WHERE nombre_platillo = 'Pollo con arroz integral porción ligera';
UPDATE platillos SET preparacion = 'Marinar el pescado con el jugo de limón durante 10 minutos.
Cocinarlo a la plancha 4 minutos por lado.
Servir con la ensalada de lechuga, tomate y pepino aliñada con el aceite.' WHERE nombre_platillo = 'Pescado al limón con ensalada';
UPDATE platillos SET preparacion = 'Cocinar la quinoa en agua durante 15 minutos.
Dorar el tofu en cubos con el aceite; agregar la cebolla y el pimentón.
Mezclar con la quinoa y servir.' WHERE nombre_platillo = 'Quinoa con tofu y pimentón';
UPDATE platillos SET preparacion = 'Cocinar la zanahoria, la papa, la cebolla y el ajo en poca agua.
Licuar con la leche descremada.
Calentar sin dejar hervir y servir.' WHERE nombre_platillo = 'Crema de zanahoria ligera';
UPDATE platillos SET preparacion = 'Saltear la espinaca y el tomate en una sartén antiadherente.
Agregar los huevos batidos y cocinar a fuego bajo.
Añadir el queso bajo en grasa al final y servir.' WHERE nombre_platillo = 'Huevos con espinaca y queso bajo grasa';
UPDATE platillos SET preparacion = 'Cocinar la quinoa y el pollo a la plancha.
Cocinar el brócoli al vapor; picar el pepino y el aguacate.
Servir todo en un tazón sobre la espinaca.' WHERE nombre_platillo = 'Bowl verde con pollo';
UPDATE platillos SET preparacion = 'Usar garbanzos cocidos y escurridos.
Picar el tomate, el pepino, el pimentón y la cebolla.
Mezclar y aliñar con limón y aceite de oliva.' WHERE nombre_platillo = 'Ensalada de garbanzos';
UPDATE platillos SET preparacion = 'Cocinar el salmón a la plancha.
Saltear el brócoli, la zanahoria y el pimentón con el aceite.
Servir el salmón sobre los vegetales.' WHERE nombre_platillo = 'Salmón con vegetales salteados';
UPDATE platillos SET preparacion = 'Sazonar el pollo con el ajo y el aceite.
Hornear a 200 °C durante 25 minutos.
Agregar el brócoli en los últimos 10 minutos y servir.' WHERE nombre_platillo = 'Pollo al horno con brócoli';
UPDATE platillos SET preparacion = 'Tostar el pan integral.
Cocinar el huevo pochado o a la plancha.
Untar el aguacate sobre el pan y servir con el huevo y el tomate.' WHERE nombre_platillo = 'Tostadas integrales con aguacate y huevo';
UPDATE platillos SET preparacion = 'Cocinar la avena con la leche descremada y la canela a fuego bajo durante 5 minutos.
Revolver hasta que espese.
Servir con las fresas picadas, sin azúcar.' WHERE nombre_platillo = 'Avena cocida con canela y fresas';
UPDATE platillos SET preparacion = 'Cocinar las lentejas hasta que ablanden.
Hacer un sofrito con la cebolla, el ajo, el tomate y el aceite.
Agregar el sofrito y la espinaca a las lentejas; cocinar 5 minutos.' WHERE nombre_platillo = 'Lentejas con espinaca';
UPDATE platillos SET preparacion = 'Servir el yogur natural sin azúcar.
Agregar las almendras troceadas por encima.' WHERE nombre_platillo = 'Yogur con almendras';
UPDATE platillos SET preparacion = 'Cocinar la quinoa y dejarla enfriar.
Picar el tomate, el pepino y la cebolla.
Mezclar con el atún escurrido y aliñar con el aceite.' WHERE nombre_platillo = 'Ensalada de quinoa y atún';
UPDATE platillos SET preparacion = 'Sofreír la cebolla, el pimentón y la zanahoria con el aceite.
Agregar el arroz integral y el pollo en trozos; cubrir con agua.
Cocinar a fuego bajo 35 minutos hasta que el arroz esté listo.' WHERE nombre_platillo = 'Arroz integral con pollo';
UPDATE platillos SET preparacion = 'Cocinar la pasta integral en agua hirviendo durante 10 minutos.
Preparar una salsa con el tomate, la cebolla y el aceite.
Agregar el atún a la salsa y mezclar con la pasta.' WHERE nombre_platillo = 'Pasta integral con atún';
UPDATE platillos SET preparacion = 'Asar la arepa integral.
Cocinar el huevo revuelto o a la plancha.
Servir la arepa con el huevo y el tomate picado.' WHERE nombre_platillo = 'Arepa integral con huevo';
UPDATE platillos SET preparacion = 'Cocinar los frijoles remojados con el plátano verde hasta que ablanden.
Agregar un sofrito de cebolla, tomate y zanahoria.
Servir con el arroz cocido aparte.' WHERE nombre_platillo = 'Sopa de frijoles con arroz';
UPDATE platillos SET preparacion = 'Pelar y trocear el banano.
Licuar con el yogur natural y la avena.
Servir sin agregar azúcar.' WHERE nombre_platillo = 'Batido de yogur con banano';
UPDATE platillos SET preparacion = 'Cocinar el arroz integral.
Cocinar el salmón a la plancha y cortarlo en trozos.
Servir el arroz con el salmón, el pepino y el aguacate.' WHERE nombre_platillo = 'Bowl de arroz integral y salmón';
UPDATE platillos SET preparacion = 'Cocinar el pollo a la plancha y cortarlo en tiras.
Tostar el pan integral.
Armar el sándwich con el pollo, la lechuga, el tomate y el queso bajo en grasa.' WHERE nombre_platillo = 'Sandwich integral de pollo';
UPDATE platillos SET preparacion = 'Cocinar la batata en cubos hasta que ablande.
Saltear la cebolla y agregar los garbanzos cocidos y la batata.
Añadir la espinaca y el aceite al final.' WHERE nombre_platillo = 'Garbanzos con batata';
UPDATE platillos SET preparacion = 'Cocinar la avena con la leche descremada durante 5 minutos.
Picar la papaya.
Servir la avena con la papaya encima.' WHERE nombre_platillo = 'Avena con papaya';
UPDATE platillos SET preparacion = 'Tostar el pan integral.
Agregar el queso bajo en grasa y el tomate en rodajas.' WHERE nombre_platillo = 'Pan integral con queso y tomate';
UPDATE platillos SET preparacion = 'Cocinar la pasta integral durante 10 minutos.
Cocinar el pollo en trozos con el aceite; agregar el tomate y el brócoli.
Mezclar con la pasta y servir.' WHERE nombre_platillo = 'Pollo con pasta integral';
UPDATE platillos SET preparacion = 'Cocinar el arroz integral.
Dorar el tofu con el aceite y agregar el brócoli, la zanahoria y el pimentón.
Mezclar con el arroz y servir.' WHERE nombre_platillo = 'Arroz integral con verduras y tofu';
UPDATE platillos SET preparacion = 'Cocinar los frijoles hasta que ablanden.
Agregar un sofrito de cebolla y tomate.
Servir con una arepa pequeña asada y el aguacate.' WHERE nombre_platillo = 'Frijoles con arepa pequeña';
UPDATE platillos SET preparacion = 'Lavar y picar las fresas, el banano, la papaya y las moras.
Servir el yogur natural y agregar la fruta encima.' WHERE nombre_platillo = 'Tazón de yogur con frutas mixtas';
UPDATE platillos SET preparacion = 'Cocinar la quinoa con la leche descremada y la canela durante 15 minutos.
Agregar la manzana picada.
Servir tibia, sin azúcar añadido.' WHERE nombre_platillo = 'Quinoa dulce con canela';
UPDATE platillos SET preparacion = 'Asar la batata en el horno durante 30 minutos.
Cocinar el pollo a la plancha.
Saltear la espinaca con el aceite y servir todo junto.' WHERE nombre_platillo = 'Batata asada con pollo';
UPDATE platillos SET preparacion = 'Escurrir el atún.
Calentar la tortilla o pan integral.
Rellenar con el atún, la lechuga, el tomate y el aguacate; enrollar.' WHERE nombre_platillo = 'Wrap integral de atún';
UPDATE platillos SET preparacion = 'Cocinar la pasta integral durante 10 minutos.
Saltear el tomate, el brócoli, el pimentón y la cebolla con el aceite.
Mezclar con la pasta y agregar el queso bajo en grasa.' WHERE nombre_platillo = 'Pasta integral con vegetales';
UPDATE platillos SET preparacion = 'Cocinar las lentejas con la papa y la zanahoria en cubos.
Agregar un sofrito de cebolla y tomate.
Cocinar 10 minutos más y servir.' WHERE nombre_platillo = 'Sopa de lentejas con papa';
UPDATE platillos SET preparacion = 'Asar la arepa integral por ambos lados.
Abrirla y rellenar con el queso bajo en grasa.' WHERE nombre_platillo = 'Arepa integral con queso bajo grasa';
UPDATE platillos SET preparacion = 'Cocinar la avena con la leche descremada y la canela.
Agregar la pera en cubos al final.
Servir sin azúcar.' WHERE nombre_platillo = 'Avena con pera';
UPDATE platillos SET preparacion = 'Cocinar el arroz integral.
Sofreír la cebolla y el tomate con el aceite y agregar los huevos batidos.
Mezclar con el arroz y servir.' WHERE nombre_platillo = 'Arroz integral con huevo';
UPDATE platillos SET preparacion = 'Cocinar el arroz blanco con el aceite y la cebolla.
Cocinar la papa en agua con sal.
Servir juntos.' WHERE nombre_platillo = 'Arroz blanco con papa';
UPDATE platillos SET preparacion = 'Cocinar la pasta en agua hirviendo durante 10 minutos.
Preparar una salsa con la mantequilla, el ajo y la crema de leche.
Mezclar con la pasta y agregar el queso.' WHERE nombre_platillo = 'Pasta cremosa tradicional';
UPDATE platillos SET preparacion = 'Asar la arepa de maíz blanco.
Untar la mantequilla y agregar el queso.' WHERE nombre_platillo = 'Arepa blanca con queso';
UPDATE platillos SET preparacion = 'Tostar el pan blanco.
Untar la mantequilla y la mermelada.' WHERE nombre_platillo = 'Pan blanco con mermelada';
UPDATE platillos SET preparacion = 'Cortar el banano en rodajas.
Bañar con la leche condensada y servir frío.' WHERE nombre_platillo = 'Postre de banano con leche condensada';
UPDATE platillos SET preparacion = 'Licuar la leche entera con el banano, las fresas y el azúcar.
Servir frío.' WHERE nombre_platillo = 'Batido azucarado de frutas';
UPDATE platillos SET preparacion = 'Sofreír la cebolla, el pimentón y la zanahoria con el aceite.
Agregar el pollo en trozos y el arroz blanco; cubrir con agua.
Cocinar a fuego bajo 20 minutos.' WHERE nombre_platillo = 'Arroz con pollo estilo casero';
UPDATE platillos SET preparacion = 'Cocinar la papa y hacer un puré con la leche entera y la mantequilla.
Cocinar la carne de res a la plancha.
Servir la carne con el puré.' WHERE nombre_platillo = 'Puré de papa con carne';
UPDATE platillos SET preparacion = 'Servir el cereal en un tazón.
Agregar la leche entera.' WHERE nombre_platillo = 'Cereal azucarado con leche';
UPDATE platillos SET preparacion = 'Mezclar la harina, el huevo y la leche hasta obtener una masa lisa.
Cocinar los pancakes en una sartén con la mantequilla.
Servir con la miel.' WHERE nombre_platillo = 'Pancakes con miel';
UPDATE platillos SET preparacion = 'Preparar un relleno con la papa cocida, la carne molida y la cebolla.
Rellenar discos de masa de maíz y cerrarlos.
Freír en el aceite hasta que estén dorados.' WHERE nombre_platillo = 'Empanadas con papa';
UPDATE platillos SET preparacion = 'Preparar una masa con la harina, agua y el aceite; extenderla.
Cubrir con la salsa de tomate, el tomate y el queso.
Hornear a 220 °C durante 12 minutos.' WHERE nombre_platillo = 'Pizza individual tradicional';
UPDATE platillos SET preparacion = 'Formar la carne de hamburguesa con la carne molida y cocinarla a la plancha.
Tostar el pan blanco.
Armar con el queso, la lechuga, el tomate y la salsa.' WHERE nombre_platillo = 'Hamburguesa con pan blanco';
UPDATE platillos SET preparacion = 'Cocinar la carne molida con la salsa de tomate.
Intercalar capas de pasta, carne, crema de leche y queso.
Hornear a 180 °C durante 30 minutos.' WHERE nombre_platillo = 'Lasaña clásica';
UPDATE platillos SET preparacion = 'Servir el helado.
Acompañar con las galletas.' WHERE nombre_platillo = 'Helado con galleta';
UPDATE platillos SET preparacion = 'Mezclar la harina, el azúcar, el huevo, el aceite y la zanahoria rallada.
Agregar las nueces picadas.
Hornear a 180 °C durante 35 minutos.' WHERE nombre_platillo = 'Torta de zanahoria azucarada';
UPDATE platillos SET preparacion = 'Cocinar los frijoles hasta que ablanden y agregar la cebolla sofrita.
Cocinar el arroz blanco con el aceite.
Servir juntos.' WHERE nombre_platillo = 'Arroz blanco con frijoles';
UPDATE platillos SET preparacion = 'Hacer un puré con la papa cocida.
Rellenar con la carne molida sofrita con cebolla y el huevo cocido.
Formar la papa rellena y freírla en el aceite.' WHERE nombre_platillo = 'Papa rellena';
UPDATE platillos SET preparacion = 'Preparar una masa de hojaldre con la harina, la mantequilla, el huevo y el azúcar.
Rellenar con el chocolate y enrollar.
Hornear a 190 °C durante 15 minutos.' WHERE nombre_platillo = 'Croissant con chocolate';
UPDATE platillos SET preparacion = 'Preparar una masa con la harina, el azúcar, el huevo y la mantequilla.
Hornear a 180 °C durante 20 minutos.
Servir con el café.' WHERE nombre_platillo = 'Pan dulce con café';
UPDATE platillos SET preparacion = 'Servir la gaseosa y el paquete de papas fritas.' WHERE nombre_platillo = 'Gaseosa y snack';
UPDATE platillos SET preparacion = 'Mezclar la harina, el azúcar, el huevo, la leche, la mantequilla y el chocolate.
Llenar moldes para muffin.
Hornear a 180 °C durante 20 minutos.' WHERE nombre_platillo = 'Muffin de chocolate';
UPDATE platillos SET preparacion = 'Mezclar la harina, el huevo, la leche y la mantequilla derretida.
Cocinar en la wafflera hasta que estén dorados.
Servir con el sirope.' WHERE nombre_platillo = 'Waffles con sirope';
UPDATE platillos SET preparacion = 'Cocinar la pasta y la carne molida.
Rellenar la pasta con la carne y cubrir con la crema de leche, el tomate y el queso.
Hornear a 180 °C durante 20 minutos.' WHERE nombre_platillo = 'Canelones con salsa cremosa';
UPDATE platillos SET preparacion = 'Cocinar la yuca y hacer un puré.
Rellenar con la carne molida y el queso; cubrir con el huevo batido.
Freír en el aceite hasta dorar.' WHERE nombre_platillo = 'Pastel de yuca';
UPDATE platillos SET preparacion = 'Cocinar el arroz blanco con la leche entera y la canela a fuego bajo.
Agregar el azúcar y revolver hasta que espese.
Servir frío o tibio.' WHERE nombre_platillo = 'Arroz con leche';
UPDATE platillos SET preparacion = 'Tostar el pan blanco.
Untar la mantequilla.' WHERE nombre_platillo = 'Pan blanco con mantequilla';
UPDATE platillos SET preparacion = 'Cortar la papa en bastones.
Freír en el aceite hasta dorar.
Servir con la salsa de tomate.' WHERE nombre_platillo = 'Papa frita con salsa';
UPDATE platillos SET preparacion = 'Preparar la masa de maíz con el aceite.
Rellenar con el pollo, la carne de cerdo y la zanahoria.
Envolver en hojas de plátano y cocinar al vapor durante 3 horas.' WHERE nombre_platillo = 'Tamal tradicional';
COMMIT;
