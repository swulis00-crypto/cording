/**
 * 화면 컴포넌트: 청구기호 배움터 (Interactive Learning Guide)
 */

import { KDC_MAIN_CLASSES, SHELF_SORT_RULES } from '../data/kdcData.js';
import { LEE_AUTHOR_RULES } from '../data/leeAuthorData.js';
import { soundFx } from '../audio/soundFx.js';

export function renderTutorialScreen(container) {
  let activeTab = 'kdc'; // 'kdc' | 'lee' | 'callNumber' | 'shelf'

  function render() {
    container.innerHTML = `
      <div class="tutorial-screen">
        <div class="section-header">
          <div class="section-header-title">
            <h2>📘 책 주소 읽기 배움터</h2>
            <p>책의 주제를 알려주는 숫자(KDC 분류번호)와 글쓴이를 알려주는 글자(저자기호)를 한눈에 익혀요! 다 읽었으면 게임에서 확인해 봐요.</p>
          </div>
        </div>

        <div class="guide-tabs">
          <button class="guide-tab-btn ${activeTab === 'kdc' ? 'active' : ''}" data-tab="kdc">
            🔢 숫자 = 주제 (KDC 10가지)
          </button>
          <button class="guide-tab-btn ${activeTab === 'callNumber' ? 'active' : ''}" data-tab="callNumber">
            🏷️ 책 주소(청구기호) 뜯어보기
          </button>
          <button class="guide-tab-btn ${activeTab === 'lee' ? 'active' : ''}" data-tab="lee">
            ✍️ 글쓴이 기호(저자기호) 만들기
          </button>
          <button class="guide-tab-btn ${activeTab === 'shelf' ? 'active' : ''}" data-tab="shelf">
            📚 책꽂이 순서 5가지 규칙
          </button>
        </div>

        <div class="guide-content-body">
          ${renderTabContent(activeTab)}
        </div>
      </div>
    `;

    container.querySelectorAll('.guide-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundFx.play('click');
        activeTab = e.target.getAttribute('data-tab');
        render();
      });
    });
  }

  function renderTabContent(tab) {
    if (tab === 'kdc') {
      return `
        <div class="kdc-classes-grid">
          ${KDC_MAIN_CLASSES.map(cls => `
            <div class="kdc-class-card" style="border-left-color: ${cls.color}; background: ${cls.accentBg};">
              <div class="kdc-card-top">
                <span class="kdc-code-pill">${cls.code}</span>
                <span class="kdc-icon" style="font-size: 1.5rem;">${cls.icon}</span>
              </div>
              <h3 class="kdc-name">${cls.name}</h3>
              <p class="kdc-summary">${cls.summary}</p>
              <ul class="kdc-sub-list">
                ${cls.divisions.map(div => `<li>• <strong>${div.code}</strong> ${div.name}</li>`).join('')}
              </ul>
              <div style="margin-top: 0.75rem; font-size: 0.78rem; color: #a5b4fc;">
                📖 대표 책: ${cls.examples.join(', ')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (tab === 'callNumber') {
      const ex = LEE_AUTHOR_RULES.callNumberVisualExample;
      return `
        <div class="glass-panel" style="padding: 2rem;">
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; text-align: center;">책등에 붙은 작은 라벨 = 책의 주소!</h3>
          <p style="text-align: center; color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
            이 라벨을 <strong>청구기호</strong>라고 불러요. 어느 방, 어느 책꽂이, 몇 번째 자리인지 모두 들어 있어요.
          </p>

          <div class="call-number-anatomy">
            <div class="anatomy-block" style="border-color: #ec4899;">
              <div class="code-text" style="color: #ec4899;">${ex.badge}</div>
              <div class="label-text">별치기호</div>
              <div class="desc-text">청소년 자료실</div>
            </div>
            <div class="anatomy-block" style="border-color: #6366f1;">
              <div class="code-text" style="color: #6366f1;">${ex.classNumber}</div>
              <div class="label-text">분류기호</div>
              <div class="desc-text">한국현대소설 (800)</div>
            </div>
            <div class="anatomy-block" style="border-color: #10b981;">
              <div class="code-text" style="color: #10b981;">${ex.authorNumber}</div>
              <div class="label-text">저자기호</div>
              <div class="desc-text">김유정 '봄봄'</div>
            </div>
            <div class="anatomy-block" style="border-color: #f59e0b;">
              <div class="code-text" style="color: #f59e0b;">${ex.volumeNumber}</div>
              <div class="label-text">권차기호</div>
              <div class="desc-text">제1권 (시리즈)</div>
            </div>
            <div class="anatomy-block" style="border-color: #06b6d4;">
              <div class="code-text" style="color: #06b6d4;">${ex.copyNumber}</div>
              <div class="label-text">복본기호</div>
              <div class="desc-text">도서관 2번째 책</div>
            </div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border-radius: var(--radius-md); padding: 1.25rem; margin-top: 1.5rem;">
            <h4 style="color: var(--accent-cyan); font-size: 1rem; margin-bottom: 0.75rem;">💡 서가에서 책 찾는 올바른 순서:</h4>
            <ol style="margin-left: 1.5rem; line-height: 1.8; font-size: 0.92rem; color: #cbd5e1;">
              <li><strong>1단계:</strong> 별치기호로 해당 자료실(어린이실, 청소년실, 종합자료실 등)로 이동합니다.</li>
              <li><strong>2단계:</strong> 분류번호(813.7)를 보고 800번대 문학 서가 번호판을 찾아갑니다.</li>
              <li><strong>3단계:</strong> 같은 813.7 번호 안에서 저자기호(김68ㅂ)의 '김'씨 가나다순으로 책을 찾습니다.</li>
              <li><strong>4단계:</strong> 시리즈물이라면 권차(v.1), 복본(c.1, c.2)을 확인하여 꺼냅니다.</li>
            </ol>
          </div>
        </div>
      `;
    }

    if (tab === 'lee') {
      return `
        <div class="glass-panel" style="padding: 2rem;">
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">이재철 저자기호표 제5표의 구성 원리</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.75rem;">
            ${LEE_AUTHOR_RULES.summary}
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            ${LEE_AUTHOR_RULES.structure.map((item, idx) => `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.2rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-pink); margin-bottom: 0.35rem;">
                  규칙 0${idx + 1}
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin-bottom: 0.4rem;">${item.part}</h4>
                <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem;">${item.explain}</p>
                <div style="background: rgba(99, 102, 241, 0.15); padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.82rem; color: #a5b4fc;">
                  예시: ${item.example}
                </div>
              </div>
            `).join('')}
          </div>

          <h4 style="font-size: 1.1rem; color: #ffffff; margin-bottom: 1rem;">📚 실전 도서 저자기호 분석 예시표</h4>
          <div style="overflow-x: auto;">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th>저자명</th>
                  <th>도서명</th>
                  <th>저자기호</th>
                  <th>분류번호</th>
                  <th>주제 분야</th>
                </tr>
              </thead>
              <tbody>
                ${LEE_AUTHOR_RULES.sampleAuthors.map(sa => `
                  <tr>
                    <td><strong>${sa.name}</strong></td>
                    <td>『${sa.title}』</td>
                    <td><span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700;">${sa.code}</span></td>
                    <td>${sa.classNo}</td>
                    <td>${sa.subject}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (tab === 'shelf') {
      return `
        <div class="glass-panel" style="padding: 2rem;">
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; text-align: center;">도서관 서가 배열의 5대 황금률</h3>
          <p style="text-align: center; color: var(--text-muted); font-size: 0.92rem; margin-bottom: 2rem;">
            도서관 서가는 왼쪽에서 오른쪽으로, 위 칸에서 아래 칸으로 지그재그(Z자) 순서로 꽂혀 있습니다.
          </p>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${SHELF_SORT_RULES.map(rule => `
              <div style="display: flex; gap: 1.25rem; align-items: flex-start; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
                <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${rule.step}
                </div>
                <div>
                  <h4 style="font-size: 1.05rem; color: #ffffff; margin-bottom: 0.35rem;">${rule.title}</h4>
                  <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.55;">${rule.description}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="result-tip-box" style="margin-top: 2rem;">
            <strong>📌 사서의 서가 찾기 특급 꿀팁:</strong><br>
            소수점 숫자는 일상생활의 '숫자의 크기'와 다릅니다! <strong>813.62</strong>와 <strong>813.7</strong>이 있을 때,
            소수 첫째 자리(6 vs 7)를 먼저 비교하므로 813.62가 813.7보다 서가 왼쪽에 먼저 놓입니다.
          </div>
        </div>
      `;
    }
  }

  render();
}
