const API_URL =
"https://script.google.com/macros/s/AKfycbzVCk4xwFTthFZxhkMfG7so3zm9zJPVRaXdDJMd5ucHsUnZb-oao4qNrf-WGD3ZJjBmbA/exec";

let currentUser = null;
let currentQuestions = [];

let timer = null;
let timeLeft = 1800;

/*
====================================
LOGIN
====================================
*/

async function login(){

  const nrp =
    document
    .getElementById("nrp")
    .value
    .trim();

  if(!nrp){

    alert("NRP wajib diisi");
    return;
  }

  try{

    const response =
      await fetch(
        `${API_URL}?action=login&nrp=${encodeURIComponent(nrp)}`
      );

    const data =
      await response.json();

    const message =
      document.getElementById("message");

    if(data.success){

      currentUser = data;

      message.innerHTML = `

        <div class="user-info">

          <h3>
            ${data.nama}
          </h3>

          <p>
            ${data.pangkat}
          </p>

          <p>
            ${data.jabatan}
          </p>

          <p>
            ${data.satuan}
          </p>

          <br>

          <button onclick="loadQuestions()">
            MULAI QUIZ
          </button>

        </div>

      `;

    } else {

      message.innerHTML = `

        <div class="motivation">

          <h3>
            LOGIN GAGAL HUB. ADMIN
          </h3>

          <p>
            ${data.message}
          </p>

        </div>

      `;
    }

  } catch(error){

    console.log(error);

    alert(
      "Gagal terhubung ke server"
    );
  }
}

/*
====================================
FULLSCREEN
====================================
*/

async function openFullscreen(){

  const elem =
    document.documentElement;

  if(elem.requestFullscreen){

    await elem.requestFullscreen();
  }
}

/*
====================================
ANTI KELUAR FULLSCREEN
====================================
*/

document.addEventListener(
  "fullscreenchange",
  () => {

    if(
      !document.fullscreenElement &&
      currentQuestions.length > 0
    ){

      alert(
        "Fullscreen wajib aktif selama quiz berlangsung!"
      );

      openFullscreen();
    }
  }
);

/*
====================================
LOAD QUESTIONS
====================================
*/

async function loadQuestions(){

  await openFullscreen();

  timeLeft = 1800;

  const response =
    await fetch(
      `${API_URL}?action=questions`
    );

  const data =
    await response.json();

  if(!data.success){

    alert("Gagal memuat soal");
    return;
  }

  currentQuestions =
    data.questions;

  showQuestions();

  startTimer();
}

/*
====================================
TIMER
====================================
*/

function startTimer(){

  clearInterval(timer);

  timer =
    setInterval(() => {

      timeLeft--;

      const minutes =
        Math.floor(timeLeft / 60);

      const seconds =
        timeLeft % 60;

      const timerElement =
        document.getElementById("timer");

      if(timerElement){

        timerElement.innerHTML = `

          ⏱️
          ${minutes}:
          ${seconds
            .toString()
            .padStart(2,"0")}

        `;
      }

      if(timeLeft <= 0){

        clearInterval(timer);

        alert(
          "Waktu habis, quiz otomatis dikirim!"
        );

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

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:25px;
          flex-wrap:wrap;
          gap:15px;
        ">

        <h2>
          QUIZ PRAJURIT
        </h2>

        <div
          id="timer"
          style="
            background:#dc2626;
            padding:12px 20px;
            border-radius:15px;
            font-weight:bold;
            font-size:20px;
            box-shadow:0 0 15px rgba(220,38,38,0.5);
          ">

          ⏱️ 30:00

        </div>

      </div>

  `;

  currentQuestions.forEach((q, index) => {

    html += `

      <div class="question">

        <h3>

          ${index + 1}.
          ${q.soal}

        </h3>

        <label>

          <input
            type="radio"
            name="q${index}"
            value="A">

          A. ${q.A}

        </label>

        <label>

          <input
            type="radio"
            name="q${index}"
            value="B">

          B. ${q.B}

        </label>

        <label>

          <input
            type="radio"
            name="q${index}"
            value="C">

          C. ${q.C}

        </label>

        <label>

          <input
            type="radio"
            name="q${index}"
            value="D">

          D. ${q.D}

        </label>

      </div>

    `;
  });

  html += `

      <button onclick="submitQuiz()">
        SUBMIT QUIZ
      </button>

    </div>

  `;

  document.querySelector(".container")
    .innerHTML = html;
}

/*
====================================
SUBMIT QUIZ
====================================
*/

async function submitQuiz(){

  clearInterval(timer);

  let correct = 0;

  currentQuestions.forEach((q, index) => {

    const answer =
      document.querySelector(
        `input[name="q${index}"]:checked`
      );

    if(answer){

      if(answer.value === q.kunci){

        correct++;
      }
    }
  });

  const poinPerSoal =
    100 / currentQuestions.length;

  const nilai =
    Math.round(
      correct * poinPerSoal
    );

  const response =
    await fetch(

      `${API_URL}?action=submit&nrp=${currentUser.nrp}&nilai=${nilai}`

    );

  const data =
    await response.json();

  let motivasi = "";

  if(nilai < 70){

    motivasi = `

      <div class="motivation">

        <h3>
          Tetap Semangat Prajurit!
        </h3>

        <p>
          Terus belajar dan jangan menyerah.
        </p>

      </div>

    `;

  } else {

    motivasi = `

      <div class="motivation">

        <h3>
          Excellent Prajurit!
        </h3>

        <p>
          Pertahankan kemampuan Anda.
        </p>

      </div>

    `;
  }

  document.querySelector(".container")
    .innerHTML = `

      <div class="quiz-box">

        <h2>
          QUIZ SELESAI
        </h2>

        <div class="result-score">

          ${nilai}

        </div>

        <p
          style="
            text-align:center;
            line-height:1.8;
          ">

          Jawaban Benar:
          ${correct}

          dari

          ${currentQuestions.length}

          <br><br>

          Percobaan:
          ${data.attempts}

        </p>

        ${motivasi}

        <div class="footer">

          Copyright © 2026
          <br>

          SOPS Yonkes 2/YBH/2 Kostrad

        </div>

      </div>

    `;

  currentQuestions = [];

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

    const response =
      await fetch(
        `${API_URL}?action=leaderboard`
      );

    const data =
      await response.json();

    if(!data.success){

      return;
    }

    let html = `

      <div class="leaderboard">

        <h2>
          TOP 10 PRAJURIT
        </h2>

    `;

    data.leaderboard.forEach(user => {

      if(Number(user.nilai) <= 0){

        return;
      }

      html += `

        <div class="rank-item">

          <div class="rank-left">

            <div class="rank-number">

              ${user.rank}

            </div>

            <div class="rank-info">

              <h3>

                ${user.nama}

              </h3>

              <p>

                ${user.pangkat}

              </p>

            </div>

          </div>

          <div class="rank-score">

            ${user.nilai}

          </div>

        </div>

      `;
    });

    html += `
      </div>
    `;

    const leaderboard =
      document.getElementById("leaderboard");

    if(leaderboard){

      leaderboard.innerHTML = html;
    }

  } catch(error){

    console.log(error);
  }
}

/*
====================================
AUTO LOAD LEADERBOARD
====================================
*/

loadLeaderboard();
