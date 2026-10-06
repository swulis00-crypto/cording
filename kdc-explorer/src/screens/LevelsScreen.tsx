import { Link } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { mainClasses, rules } from '../data/index.ts'
import { GAME_LEVELS, isLevelCompleted, isLevelUnlocked } from '../features/progress/levels.ts'
import styles from './Pages.module.css'

/** 게임 단계 선택 */
export function LevelsScreen() {
  const { progress } = useProgress()
  const preview = isPreviewMode()
  const content = { mainClassIds: mainClasses.map((c) => c.id), ruleIds: rules.map((r) => r.id) }
  // 단계별 진행 정도 (1단계: 구역, 2단계: 규칙)
  const steps: Record<number, { done: number; total: number; unit: string }> = {
    1: { done: content.mainClassIds.filter((id) => progress.completedClassifications.includes(id)).length, total: content.mainClassIds.length, unit: '구역' },
    2: { done: content.ruleIds.filter((id) => progress.completedRules.includes(id)).length, total: content.ruleIds.length, unit: '규칙' },
  }

  return (
    <section aria-labelledby="levels-title">
      <h1 id="levels-title" className={styles.title}>
        게임 단계
      </h1>
      <p className={styles.intro}>단계를 하나씩 마치면 다음 단계가 열려요. 마친 단계는 언제든 다시 할 수 있어요.</p>

      <ol className={styles.levels}>
        {GAME_LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level.number, progress, content, preview)
          const done = isLevelCompleted(level.number, progress, content)
          const step = steps[level.number]
          const playable = unlocked && level.ready
          return (
            <li key={level.number} className={`${styles.level} ${playable ? '' : styles.levelLocked}`}>
              <span className={styles.levelNumber} aria-hidden="true">
                {unlocked ? level.number : '🔒'}
              </span>
              <div>
                <h2 className={styles.levelTitle}>
                  <span className="visually-hidden">{level.number}단계: </span>
                  {level.title}
                </h2>
                <p className={styles.levelSummary}>{level.summary}</p>
                <p className={styles.levelState}>
                  {!unlocked
                    ? `🔒 ${level.number - 1}단계를 마치면 열려요`
                    : !level.ready
                      ? '🛠 준비 중이에요'
                      : done
                        ? '✔ 완료'
                        : step
                          ? `진행 중 · ${step.unit} ${step.done} / ${step.total}`
                          : '열림'}
                </p>
              </div>
              {playable && (
                <Link to={level.path} className="btn btn-primary">
                  {done ? '다시 하기' : step && step.done > 0 ? '이어하기' : '시작하기'}
                  <span className="visually-hidden">: {level.title}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
