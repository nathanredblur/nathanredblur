// script to write answer in https://stopots.com/

function llenarCamposStop(respuestas) {
    // Obtener todos los labels que contienen las categorías
    const labels = document.querySelectorAll('label');
    
    labels.forEach(label => {
        // Extraer el nombre de la categoría del span
        const spanCategoria = label.querySelector('span');
        if (!spanCategoria) return;
        
        // Obtener el texto de la categoría (sin el tooltip)
        let categoria = spanCategoria.childNodes[0].textContent.trim();
        
        // Obtener el input correspondiente
        const input = label.querySelector('input[type="text"]');
        if (!input) return;
        
        // Buscar la respuesta en el objeto
        let respuesta = respuestas[categoria];
        
        // Si encontró una respuesta, llenar el campo
        if (respuesta) {
            // Obtener el setter nativo de React
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            ).set;
            
            // Establecer el valor
            nativeInputValueSetter.call(input, respuesta);
            
            // Disparar eventos que React escucha
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log(`✓ ${categoria}: ${respuesta}`);
        } else {
            console.log(`✗ ${categoria}: No encontrada`);
        }
    });
}

// Uso con letra L:
llenarCamposStop({
    'Nombre': 'Laura',
    'País': 'Líbano',
    'Apellido': 'López',
    'Ciudad': 'Lima',
    'Objeto': 'Lámpara',
    'Cantante': 'Luis Fonsi',
    'Profesión': 'Locutor',
    'Animal': 'León',
    'Compañia': 'LG',
    'Pelicula': 'La La Land',
    'Fruta': 'Lima',
    'Color': 'Lila'
});
