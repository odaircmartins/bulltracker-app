let watchId;
let geoLocalizacao;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyC4uAyFSzeGavlJWpLL533fZzm9oBv5AeY",
    authDomain: "bulltracker-7ae25.firebaseapp.com",
    databaseURL: "https://bulltracker-7ae25.firebaseio.com",
    projectId: "bulltracker-7ae25",
    storageBucket: "bulltracker-7ae25.appspot.com",
    messagingSenderId: "824064087917"
};
firebase.initializeApp(config);

var bullsRef = firebase.database().ref('bulls/')
var key = 0

let campoAnotacoes = document.querySelector('#anotacoes');
let fieldAnotacoes = document.querySelector('.anotacoes');

let botaoRomperColeira = document.querySelector('#botao-coleira');
let fieldRomperColeira = document.querySelector('.botao-coleira');
let statusColeira = false;
botaoRomperColeira.addEventListener('click', romperColeira);

let anotacoes = '';
let btnSalvarAnotacoes = document.querySelector('#salvar-anotacoes');
btnSalvarAnotacoes.addEventListener('click', salvarAnotacoes);

function salvarAnotacoes(){
  anotacoes = campoAnotacoes.value;
}

function romperColeira() {
  if(!statusColeira) {
    statusColeira = true;
    botaoRomperColeira.innerText = "Restaurar coleira";
  } else {
    statusColeira = false;
    botaoRomperColeira.innerText = "Romper coleira";
  }
}

function getLocation() {
    let botaoLocalizador = document.getElementById("botao-localizador");
    let latitude = document.getElementById("latitude");
    let longitude = document.getElementById("longitude");  
    let nomeDoBoi = document.getElementById("nome-do-boi");
    let status = botaoLocalizador.innerText;
        
    if (status == "Localizar"){
        botaoLocalizador.innerText = "Parar"  

        fieldRomperColeira.hidden = false;
        fieldAnotacoes.hidden = false;
        
        let register = bullsRef.push({name: nomeDoBoi.value, latitude: 0, longitude: 0, timestamp: 0, coleiraRompida: statusColeira, anotacoes: anotacoes})
        key = register.key

        geoLocalizacao = navigator.geolocation

        watchId = geoLocalizacao.watchPosition((position)=>{
            latitude.innerHTML = position.coords.latitude
            longitude.innerHTML = position.coords.longitude

            let currentBullRef = firebase.database().ref('bulls/' + key)

            currentBullRef.update ({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
                coleiraRompida: statusColeira,
                anotacoes: anotacoes
            })

            teste = currentBullRef
        }, function(error){ 
            console.log(error) 
        }, {enableHighAccuracy: true, maximumAge: 30000, timeout: 30000})                
    }

    if (status == "Parar"){
        geoLocalizacao.clearWatch(watchId);
        botaoLocalizador.innerText = "Localizar"  
        latitude.innerHTML = ""
        longitude.innerHTML = ""
        nomeDoBoi.value = ""
        let currentBullRef = firebase.database().ref('bulls/' + key)
        currentBullRef.remove();
        fieldRomperColeira.hidden = true;
        fieldAnotacoes.hidden = true;
    }
}

let newWorker;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./bulltracker-service-worker.js") // [A]
    .then(function(registration) {
      registration.addEventListener("updatefound", () => { // [B]
        // Uma atualização no Service Worker foi encontrada, instalando...
        console.log("1 - Uma atualização no Service Worker foi encontrada, instalando...");
        newWorker = registration.installing; // [C]

        newWorker.addEventListener("statechange", () => {
          // O estado do Service Worker mudou?
          console.log("2 - O estado do Service Worker mudou?");
          switch (newWorker.state) {
            case "installed": {
              // Existe um novo Service Worker disponível, mostra a notificação
              console.log("3 - Existe um novo Service Worker disponível, mostra a notificação");
              if (navigator.serviceWorker.controller) {
                document.getElementById('update-button').style.display = "block";
                // O evento de clique na notificação
                document.getElementById("update-button").addEventListener("click", function() {
                    newWorker.postMessage({ action: "skipWaiting" });
                })  
                break;
              }
            }
          }
        });
      });

      // SUCESSO - ServiceWorker Registrado
      console.log("4 - ServiceWorker registrado com sucesso no escopo: ", registration.scope);
    })
    .catch(function(err) {
      // ERRO - Falha ao registrar o ServiceWorker
      console.log("5 - Falha ao registrar o ServiceWorker: ", err);
    })
}

let refreshing;

window.addEventListener('appinstalled', (e) => {
    console.log("APP pode ser instalado");
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  document.getElementById('add-button').style.display = "block";

  document.getElementById('add-button').addEventListener('click', (e) => {
    // hide our user interface that shows our A2HS button
    document.getElementById('add-button').style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
  });
});

// Esse evento será chamado quando o Service Worker for atualizado
// Aqui estamos recarregando a página
navigator.serviceWorker.addEventListener("controllerchange", function() {
  if (refreshing) {
    return;
  }
  window.location.reload();
  refreshing = true;
  console.log("Refresh foi realizado")
});