/**
 * 화면 컴포넌트: 사서용 관리자 화면 (Librarian Admin Panel)
 */

import { store, GAME_METADATA } from '../state/store.js';
import { soundFx } from '../audio/soundFx.js';

export function renderAdminPanelScreen(container) {
  let isAuthenticated = sessionStorage.getItem('librarian_auth') === 'true';
  let enteredPin = '';
  let activeTab = 'books'; // 'books' | 'questions' | 'backup'
  let searchQuery = '';

  function render() {
    if (!isAuthenticated) {
      renderPinLock();
      return;
    }
    renderDashboard();
  }

  function renderPinLock() {
    container.innerHTML = `
      <div class="admin-lock-card glass-panel">
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">🔐</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.4rem;">사서 선생님 전용</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">
          도서 자료와 게임 문제를 관리하는 화면이에요. 선생님만 아는 숫자 4자리를 눌러 주세요.
        </p>

        <div class="pin-display">
          ${[0, 1, 2, 3].map(i => `
            <div class="pin-dot ${i < enteredPin.length ? 'filled' : ''}"></div>
          `).join('')}
        </div>

        <div class="numpad-grid">
          ${['1','2','3','4','5','6','7','8','9','C','0','✓'].map(btn => `
            <button class="numpad-btn" data-key="${btn}">${btn}</button>
          `).join('')}
        </div>

        <button id="btnCancelAdmin" class="btn-secondary-large" style="width: 100%; margin-top: 1.5rem;">
          돌아가기
        </button>
      </div>
    `;

    container.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundFx.play('click');
        const k = e.target.getAttribute('data-key');
        if (k === 'C') {
          enteredPin = '';
        } else if (k === '✓') {
          checkPin();
        } else {
          if (enteredPin.length < 4) {
            enteredPin += k;
            if (enteredPin.length === 4) {
              setTimeout(checkPin, 100);
            }
          }
        }
        renderPinLock();
      });
    });

    container.querySelector('#btnCancelAdmin').addEventListener('click', () => {
      soundFx.play('click');
      store.setScreen('game-select');
    });
  }

  function checkPin() {
    if (enteredPin === '1234') {
      soundFx.play('correct');
      isAuthenticated = true;
      sessionStorage.setItem('librarian_auth', 'true');
      renderDashboard();
    } else {
      soundFx.play('wrong');
      alert('숫자가 맞지 않아요. 사서 선생님께 물어보세요!');
      enteredPin = '';
      renderPinLock();
    }
  }

  function renderDashboard() {
    const books = store.books.filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) ||
             b.author.toLowerCase().includes(q) ||
             b.classNo.includes(q) ||
             b.callNumber.toLowerCase().includes(q);
    });

    container.innerHTML = `
      <div class="admin-screen">
        <div class="section-header">
          <div class="section-header-title">
            <h2>⚙️ 사서 선생님 관리 화면</h2>
            <p>우리 도서관 책을 등록하고 게임 문제를 관리합니다. 학생의 이름·점수 등 개인정보는 어디에도 저장되지 않습니다.</p>
          </div>
          <div class="admin-header-actions">
            <button id="btnAdminLogout" class="btn-small danger">
              로그아웃 🔒
            </button>
          </div>
        </div>

        <div class="guide-tabs">
          <button class="guide-tab-btn ${activeTab === 'books' ? 'active' : ''}" data-tab="books">
            📚 도서 자료 관리 (${store.books.length}권)
          </button>
          <button class="guide-tab-btn ${activeTab === 'questions' ? 'active' : ''}" data-tab="questions">
            📝 6개 게임 문제 검토
          </button>
          <button class="guide-tab-btn ${activeTab === 'backup' ? 'active' : ''}" data-tab="backup">
            💾 데이터 백업 & 복원
          </button>
        </div>

        <div class="glass-panel" style="overflow: hidden;">
          ${renderAdminTabBody(books)}
        </div>
      </div>
    `;

    // Logout
    container.querySelector('#btnAdminLogout').addEventListener('click', () => {
      soundFx.play('click');
      isAuthenticated = false;
      sessionStorage.removeItem('librarian_auth');
      store.setScreen('start');
    });

    // Tab buttons
    container.querySelectorAll('.guide-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundFx.play('click');
        activeTab = e.target.getAttribute('data-tab');
        renderDashboard();
      });
    });

    attachTabEvents();
  }

  function renderAdminTabBody(books) {
    if (activeTab === 'books') {
      return `
        <div class="admin-table-controls">
          <input
            type="text"
            id="bookSearchInput"
            class="search-input-box"
            placeholder="도서명, 저자, 청구기호 검색..."
            value="${searchQuery}"
          />
          <div style="display: flex; gap: 0.5rem;">
            <button id="btnAddNewBook" class="btn-small primary">
              + 새 도서 등록
            </button>
            <button id="btnResetBooks" class="btn-small danger">
              기본 도서 복원
            </button>
          </div>
        </div>

        <div style="overflow-x: auto; max-height: 520px;">
          <table class="ranking-table">
            <thead>
              <tr>
                <th>도서명</th>
                <th>저자</th>
                <th>KDC 분류기호</th>
                <th>이재철 저자기호</th>
                <th>완성된 청구기호</th>
                <th>서가 위치</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${books.map(b => `
                <tr>
                  <td><strong>${b.title}</strong></td>
                  <td>${b.author}</td>
                  <td><span style="background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">${b.classNo}</span></td>
                  <td><span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">${b.authorNo}</span></td>
                  <td><code>${b.callNumber}</code></td>
                  <td style="font-size: 0.82rem; color: var(--text-muted);">${b.shelfSection || '-'}</td>
                  <td>
                    <button class="btn-small danger btn-del-book" data-id="${b.id}" style="padding: 0.25rem 0.6rem;">삭제</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (activeTab === 'questions') {
      return `
        <div style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem;">게임별 문제 은행 검토</h3>
            <button id="btnResetQuestions" class="btn-small danger">문제 데이터 초기화</button>
          </div>
          <div class="result-tip-box" style="margin: 0 0 1.25rem 0;">
            <strong>🎲 매번 다른 문제가 나옵니다.</strong> 한 판에는 아래 등록 문제 일부(최대 60%)와,
            KDC 분류표·등록 도서 목록으로 자동 생성한 문제가 섞여 나옵니다.
            도서 자료를 많이 등록할수록 미로·책꽂이·두더지 게임의 문제가 더 다양해집니다.
          </div>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${Object.entries(GAME_METADATA).map(([gid, meta]) => {
              const basicQ = store.getQuestions(gid, 'basic');
              const chalQ = store.getQuestions(gid, 'challenge');
              return `
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.4rem;">${meta.icon}</span>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff;">${meta.title}</h4>
                    <span style="font-size: 0.78rem; color: #a5b4fc; margin-left: auto;">기본 ${basicQ.length}문항 / 도전 ${chalQ.length}문항</span>
                  </div>
                  <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${meta.description}</p>
                  <div style="font-size: 0.82rem; color: #cbd5e1; background: rgba(0,0,0,0.25); padding: 0.6rem 0.85rem; border-radius: 6px;">
                    🎯 <strong>학습 평가 기준:</strong> ${meta.skills}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (activeTab === 'backup') {
      return `
        <div style="padding: 2rem;">
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">데이터 백업 및 다른 PC로 옮기기</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 2rem;">
            도서 목록과 문제 데이터를 JSON 파일로 내보내거나 다른 도서관 PC에서 불러올 수 있습니다. (학생 정보는 포함되지 않습니다)
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem;">
              <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: #38bdf8;">📥 데이터 내보내기 (Backup)</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                현재 등록된 도서 목록과 문제 데이터를 JSON 파일로 다운로드합니다.
              </p>
              <button id="btnExportData" class="btn-primary-large" style="width: 100%;">
                <span>💾 JSON 다운로드</span>
              </button>
            </div>

            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem;">
              <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: #34d399;">📤 데이터 가져오기 (Restore)</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                기존에 백업해둔 JSON 파일을 불러와 데이터를 복원합니다.
              </p>
              <input type="file" id="importFileInput" accept=".json" style="display: none;" />
              <button id="btnImportData" class="btn-secondary-large" style="width: 100%;">
                <span>📂 파일 선택하여 불러오기</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  function attachTabEvents() {
    if (activeTab === 'books') {
      const searchInput = container.querySelector('#bookSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          renderDashboard();
        });
      }

      const btnAdd = container.querySelector('#btnAddNewBook');
      if (btnAdd) {
        btnAdd.addEventListener('click', showAddBookModal);
      }

      const btnReset = container.querySelector('#btnResetBooks');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          if (confirm('모든 도서 목록을 기본 권장도서 목록으로 되돌리시겠습니까?')) {
            soundFx.play('click');
            store.resetBooksToDefault();
            renderDashboard();
          }
        });
      }

      container.querySelectorAll('.btn-del-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('이 도서를 목록에서 삭제하시겠습니까?')) {
            soundFx.play('click');
            store.deleteBook(id);
            renderDashboard();
          }
        });
      });
    }

    if (activeTab === 'questions') {
      const btnResetQ = container.querySelector('#btnResetQuestions');
      if (btnResetQ) {
        btnResetQ.addEventListener('click', () => {
          if (confirm('모든 게임 문제를 초기 기본값으로 복원하시겠습니까?')) {
            soundFx.play('click');
            store.resetQuestionsToDefault();
            alert('문제 데이터가 초기화되었습니다.');
            renderDashboard();
          }
        });
      }
    }

    if (activeTab === 'backup') {
      const btnExport = container.querySelector('#btnExportData');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          soundFx.play('click');
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(store.exportAllData());
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", `book_trail_backup_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        });
      }

      const btnImport = container.querySelector('#btnImportData');
      const fileInput = container.querySelector('#importFileInput');
      if (btnImport && fileInput) {
        btnImport.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            const res = store.importData(evt.target.result);
            if (res.success) {
              soundFx.play('correct');
              alert('데이터를 성공적으로 복원했습니다!');
              renderDashboard();
            } else {
              soundFx.play('wrong');
              alert('파일 복원 실패: ' + res.error);
            }
          };
          reader.readAsText(file);
        });
      }
    }
  }

  function showAddBookModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal-window">
          <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
          <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.35rem;">새 실전 도서 자료 등록</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">
            도서관 실제 서가에 꽂혀 있는 책의 청구기호 정보를 입력하세요.
          </p>

          <form id="addBookForm">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">도서명 (제목) *</label>
                <input type="text" class="form-input" id="formTitle" required placeholder="예: 어린 왕자" />
              </div>
              <div class="form-group">
                <label class="form-label">저자명 *</label>
                <input type="text" class="form-input" id="formAuthor" required placeholder="예: 생텍쥐페리" />
              </div>
              <div class="form-group">
                <label class="form-label">출판사</label>
                <input type="text" class="form-input" id="formPublisher" placeholder="예: 열린책들" />
              </div>
              <div class="form-group">
                <label class="form-label">KDC 분류기호 (분류번호) *</label>
                <input type="text" class="form-input" id="formClassNo" required placeholder="예: 863" />
              </div>
              <div class="form-group">
                <label class="form-label">이재철 저자기호 *</label>
                <input type="text" class="form-input" id="formAuthorNo" required placeholder="예: 생83ㅇ" />
              </div>
              <div class="form-group">
                <label class="form-label">완성된 전체 청구기호 *</label>
                <input type="text" class="form-input" id="formCallNo" required placeholder="예: 청 863 생83ㅇ" />
              </div>
              <div class="form-group full">
                <label class="form-label">서가 위치 안내</label>
                <input type="text" class="form-input" id="formShelfSection" placeholder="예: 800 문학 서가 (프랑스문학 코너)" />
              </div>
              <div class="form-group full">
                <label class="form-label">게임 단서 및 줄거리 힌트</label>
                <input type="text" class="form-input" id="formClue" placeholder="예: 소행성 B612에서 온 어린 왕자의 이야기" />
              </div>
            </div>

            <div style="display: flex; gap: 0.85rem; margin-top: 1.75rem;">
              <button type="submit" class="btn-primary-large" style="flex: 1;">
                <span>저장 완료</span>
              </button>
              <button type="button" id="btnCancelBookAdd" class="btn-secondary-large">
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalContainer.innerHTML = ''; };
    modalContainer.querySelector('#modalCloseBtn').addEventListener('click', close);
    modalContainer.querySelector('#btnCancelBookAdd').addEventListener('click', close);

    modalContainer.querySelector('#addBookForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = modalContainer.querySelector('#formTitle').value.trim();
      const author = modalContainer.querySelector('#formAuthor').value.trim();
      const publisher = modalContainer.querySelector('#formPublisher').value.trim();
      const classNo = modalContainer.querySelector('#formClassNo').value.trim();
      const authorNo = modalContainer.querySelector('#formAuthorNo').value.trim();
      const callNumber = modalContainer.querySelector('#formCallNo').value.trim();
      const shelfSection = modalContainer.querySelector('#formShelfSection').value.trim();
      const clue = modalContainer.querySelector('#formClue').value.trim();

      store.addBook({
        title, author, publisher, classNo, authorNo, callNumber, shelfSection, clue
      });

      soundFx.play('correct');
      close();
      renderDashboard();
    });
  }

  render();
}
