const API_URL =
"https://script.google.com/macros/s/AKfycbzVCk4xwFTthFZxhkMfG7so3zm9zJPVRaXdDJMd5ucHsUnZb-oao4qNrf-WGD3ZJjBmbA/exec";

let currentUser = null;
let currentQuestions = [];
let timer = null;
let timeLeft = 1800;

/*
====================================
LOGIN (TETAP NRP)
====================================
*/

async function login(){

  const nrp =
    document.getElementById("nrp").value.trim();

  if(!nrp){
    alert("NRP wajib diisi");
    return;
  }

  try{

    const response = await fetch(
      `${API_URL}?action=login&nrp=${encodeURIComponent(nrp)}`
    );

    const data = await response.json();

    const message = document.getElementById("message");

    if(data.success){

      currentUser = data;

      message.innerHTML = `
        <div class="user-info">
          <h3>${data.nama}</h3>
          <p>${data.pangkat}</p>
          <p>${data.jabatan}</p>
          <p>${data.satuan}</p>
          <br>
          <button onclick="loadQuestions()">MULAI QUIZ</button>
        </div>
      `;

    } else {

      message.innerHTML = `
        <div class="motivation">
          <h3>LOGIN GAGAL</h3>
          <p>${data.message}</p>
        </div>
      `;
    }

  } catch(err){
    alert("Server tidak merespon, coba lagi");
    console.log(err);
  }
}

/*
====================================
FULLSCREEN (SAFE)
====================================
*/

async function openFullscreen(){

  const el = document.documentElement;

  if(el.requestFullscreen){
    try{
      await el.requestFullscreen();
    } catch(e){}
  }
}

/*
====================================
LOAD QUESTIONS
====================================
*/

async function loadQuestions(){

  await openFullscreen();
  timeLeft = 1800;

  try{

    const res = await fetch(`${API_URL}?action=questions`);
    const data = await res.json();

    if(!data.success){
      alert("Soal gagal dimuat");
      return;
    }

    currentQuestions = data.questions;

    showQuestions();
    startTimer();

  } catch(err){
    alert("Gagal konek ke server soal");
  }
}

/*
====================================
TIMER
====================================
*/

function startTimer(){

  clearInterval(timer);

  timer = setInterval(() => {

    timeLeft--;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;

    const el = document.getElementById("timer");

    if(el){
      el.innerHTML = `⏱️ ${m}:${s.toString().padStart(2,"0")}`;
    }

    if(timeLeft <= 0){
      clearInterval(timer);
      submitQuiz();
    }

  }, 1000);
}

/*
====================================
SHOW QUESTIONS
====================================
*/

function showQuestions(){

  let html = `
  <div class="quiz-box">

    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <h2>QUIZ PRAJURIT</h2>

      <div id="timer">⏱️ 30:00</div>
    </div>
  `;

  currentQuestions.forEach((q,i) => {

    html += `
      <div class="question">
        <h3>${i+1}. ${q.soal}</h3>

        <label><input type="radio" name="q${i}" value="A"> A. ${q.A}</label>
        <label><input type="radio" name="q${i}" value="B"> B. ${q.B}</label>
        <label><input type="radio" name="q${i}" value="C"> C. ${q.C}</label>
        <label><input type="radio" name="q${i}" value="D"> D. ${q.D}</label>
      </div>
    `;
  });

  html += `
    <button onclick="submitQuiz()">SUBMIT</button>
  </div>
  `;

  document.querySelector(".container").innerHTML = html;
}

/*
====================================
SUBMIT QUIZ
====================================
*/

async function submitQuiz(){

  clearInterval(timer);

  let correct = 0;

  currentQuestions.forEach((q,i) => {

    const ans =
      document.querySelector(`input[name="q${i}"]:checked`);

    if(ans && ans.value === q.kunci){
      correct++;
    }
  });

  const nilai =
    Math.round((correct / currentQuestions.length) * 100);

  try{

    await fetch(
      `${API_URL}?action=submit&nrp=${currentUser.nrp}&nilai=${nilai}`
    );

  } catch(e){
    console.log("submit gagal tapi lanjut");
  }

  let motivasi =
    nilai < 70
    ? "Tetap semangat prajurit!"
    : "Excellent prajurit!";

  document.querySelector(".container").innerHTML = `
    <div class="quiz-box">

      <h2>QUIZ SELESAI</h2>

      <div class="result-score">${nilai}</div>

      <p style="text-align:center;">
        Benar: ${correct} / ${currentQuestions.length}
      </p>

      <div class="motivation">
        ${motivasi}
      </div>

    </div>
  `;

  if(document.fullscreenElement){
    document.exitFullscreen();
  }

  loadLeaderboard();
}

/*
====================================
LEADERBOARD
====================================
*/

async function loadLeaderboard(){

  try{

    const res = await fetch(`${API_URL}?action=leaderboard`);
    const data = await res.json();

    if(!data.success) return;

    let html = `<div class="leaderboard"><h2>TOP PRAJURIT</h2>`;

    data.leaderboard.forEach(u => {

      if(Number(u.nilai) <= 0) return;

      html += `
        <div class="rank-item">
          <div>
            <b>${u.rank}. ${u.nama}</b><br>
            <small>${u.pangkat}</small>
          </div>
          <div class="rank-score">${u.nilai}</div>
        </div>
      `;
    });

    html += `</div>`;

    document.getElementById("leaderboard").innerHTML = html;

  } catch(e){
    console.log("leaderboard gagal");
  }
}

loadLeaderboard();