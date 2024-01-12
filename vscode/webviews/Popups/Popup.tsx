import { VSCodeLink } from '@vscode/webview-ui-toolkit/react'
import classNames from 'classnames'

import styles from './Popup.module.css'

export interface PopupOpenProps {
    isOpen: boolean
    onDismiss: () => void
}

interface BackdropProps {
    dismiss: () => void
}

export const Backdrop: React.FunctionComponent<React.PropsWithoutRef<BackdropProps>> = ({ dismiss }) => {
    const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Escape') {
            dismiss()
        }
    }
    const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation()
        dismiss()
    }
    return <div className={styles.backdrop} onClick={handleClick} onKeyUp={handleKeyUp} role="presentation" />
}

interface PopupFrameProps {
    classNames?: string[]
    actionButtons?: React.ReactNode
}

interface PopupProps extends Omit<PopupFrameProps, 'classNames'>, PopupOpenProps {
    className?: string
    title: React.ReactNode
    text: React.ReactNode
    linkText: React.ReactNode
    linkHref: string
    linkTarget?: '_blank'
}

export const PopupFrame: React.FunctionComponent<React.PropsWithChildren<PopupFrameProps & PopupOpenProps>> = ({
    actionButtons,
    classNames: extraClassNames,
    onDismiss,
    isOpen,
    children,
}) => {
    const handleKeyUp = (e: React.KeyboardEvent<HTMLDialogElement>): void => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            onDismiss()
        }
    }
    return (
        isOpen && (
            <>
                <dialog
                    open={true}
                    className={classNames(styles.popup, ...(extraClassNames || []))}
                    onKeyUp={handleKeyUp}
                >
                    <div className={styles.row}>{children}</div>
                    {actionButtons && (
                        <div className={classNames(styles.actionButtonContainer, styles.row)}>{actionButtons}</div>
                    )}
                </dialog>
                <div className={styles.pointyBit} />
                <Backdrop dismiss={onDismiss} />
            </>
        )
    )
}

// Note, if the popup's parent is interactive, the button's event handlers should prevent event
// propagation.
export const Popup: React.FunctionComponent<React.PropsWithChildren<PopupProps>> = ({
    className,
    title,
    text,
    linkText,
    linkHref,
    linkTarget,
    actionButtons,
    onDismiss,
    isOpen,
}) => (
    <PopupFrame
        classNames={className ? [className] : []}
        isOpen={isOpen}
        onDismiss={onDismiss}
        actionButtons={actionButtons}
    >
        <div className={styles.noticeText}>
            <h1>{title}</h1>
            {text && <p>{text}</p>}
            {linkText && linkHref && (
                <p>
                    <VSCodeLink href={linkHref} target={linkTarget}>
                        {linkText}
                    </VSCodeLink>
                </p>
            )}
        </div>
    </PopupFrame>
)
