import qrcode from 'qrcode-generator'
import { useEffect, useRef } from 'react'
import { phoneUrl } from '../utils/phoneUrl.ts'
import styles from './QrPanel.module.css'

/** 주소를 QR 코드 SVG로 그린다 (인터넷 연결 없이 앱 안에서 만든다). */
function QrSvg({ text }: { text: string }) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const size = qr.getModuleCount()
  const quiet = 4
  const cells: string[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.isDark(r, c)) cells.push(`M${c + quiet} ${r + quiet}h1v1h-1z`)
    }
  }
  const box = size + quiet * 2
  return (
    <svg viewBox={`0 0 ${box} ${box}`} className={styles.qr} role="img" aria-label="휴대폰으로 이 화면을 여는 QR 코드">
      <rect width={box} height={box} fill="#fff" />
      <path d={cells.join('')} fill="#000" />
    </svg>
  )
}

/** 📱 QR: 지금 화면을 휴대폰으로 바로 열 수 있는 QR 코드 */
export function QrPanel({ onClose }: { onClose: () => void }) {
  const url = phoneUrl(window.location)
  const local = url !== window.location.href
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <div
      id="qr-panel"
      className={styles.panel}
      role="dialog"
      aria-labelledby="qr-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <h2 id="qr-title" ref={titleRef} tabIndex={-1} className={styles.title}>
        <span aria-hidden="true">📱 </span>휴대폰으로 보기
      </h2>
      <QrSvg text={url} />
      <p className={styles.help}>휴대폰 카메라로 QR 코드를 비추면 지금 보고 있는 화면이 열려요.</p>
      {local && (
        <p className={styles.note}>
          지금은 이 컴퓨터(localhost)에서 보고 있어서, 휴대폰에서는 온라인 주소로 열려요. 아직 배포하지 않은 수정 내용은
          보이지 않을 수 있어요.
        </p>
      )}
      <p className={styles.url}>
        <a href={url}>{url}</a>
      </p>
      <button type="button" className="btn" onClick={onClose}>
        닫기
      </button>
    </div>
  )
}
