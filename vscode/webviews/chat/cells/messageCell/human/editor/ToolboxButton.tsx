import type { AgentToolboxSettings, WebviewToExtensionAPI } from '@sourcegraph/cody-shared'
import { FlaskConicalIcon, FlaskConicalOffIcon } from 'lucide-react'
import { type FC, memo, useCallback, useEffect, useState } from 'react'
import { Badge } from '../../../../../components/shadcn/ui/badge'
import { Button } from '../../../../../components/shadcn/ui/button'
import { Command, CommandGroup, CommandList } from '../../../../../components/shadcn/ui/command'
import { ToolbarPopoverItem } from '../../../../../components/shadcn/ui/toolbar'
import { useTelemetryRecorder } from '../../../../../utils/telemetry'

interface ToolboxButtonProps {
    api: WebviewToExtensionAPI
    settings: AgentToolboxSettings
}

const ToolboxOptionText = {
    agentic:
        'Enhances responses by searching your codebase and using available tools to gather relevant context.',
    terminal: 'Execute command automatically for context. Enable with caution as mistakes are possible.',
}

export const ToolboxButton: FC<ToolboxButtonProps> = memo(({ settings, api }) => {
    const telemetryRecorder = useTelemetryRecorder()

    const [isLoading, setIsLoading] = useState(false)
    const [settingsForm, setSettingsForm] = useState<AgentToolboxSettings>(settings)

    useEffect(() => {
        setSettingsForm(settings)
    }, [settings])

    const onOpenChange = useCallback(
        (open: boolean): void => {
            if (open) {
                telemetryRecorder.recordEvent('cody.toolboxSettings', 'opened', {
                    billingMetadata: { product: 'cody', category: 'billable' },
                })
            } else {
                // Reset form to original settings when closing
                setSettingsForm(settings)
            }
        },
        [telemetryRecorder.recordEvent, settings]
    )

    const onSubmit = useCallback(
        (close: () => void) => {
            setIsLoading(true)

            if (settings !== settingsForm) {
                telemetryRecorder.recordEvent('cody.toolboxSettings', 'updated', {
                    billingMetadata: { product: 'cody', category: 'billable' },
                    metadata: {
                        agent: settingsForm.agent?.name ? 1 : 0,
                        shell: settingsForm.shell?.enabled ? 1 : 0,
                    },
                })
            }

            const subscription = api.updateToolboxSettings(settingsForm).subscribe({
                next: () => {
                    setIsLoading(false)
                    close()
                },
                error: error => {
                    console.error('updateToolboxSettings:', error)
                    setSettingsForm(settings)
                    setIsLoading(false)
                },
                complete: () => {
                    setIsLoading(false)
                },
            })
            return () => {
                subscription.unsubscribe()
            }
        },
        [api.updateToolboxSettings, settingsForm, settings, telemetryRecorder]
    )

    return (
        <div className="tw-flex tw-items-center">
            <ToolbarPopoverItem
                role="combobox"
                iconEnd={null}
                className="tw-opacity-100"
                tooltip="Chat Settings"
                aria-label="Chat Settings"
                popoverContent={close => (
                    <Command>
                        <CommandList>
                            <header className="tw-flex tw-justify-between tw-px-6 tw-py-3 tw-border-t tw-border-border tw-bg-muted tw-w-full">
                                <h2 className="tw-text-md tw-font-semibold">Agentic Context</h2>
                                <Badge variant="secondary">Experimental</Badge>
                            </header>
                            <CommandGroup className="tw-p-6">
                                <div className="tw-container tw-flex tw-gap-2 tw-align-baseline">
                                    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2 tw-w-full">
                                        <div className="tw-flex tw-flex-1 tw-w-full tw-items-center tw-justify-between">
                                            <h3 className="tw-text-sm">Agentic Chat</h3>
                                            <Switch
                                                checked={!!settingsForm.agent?.name}
                                                onChange={() =>
                                                    setSettingsForm({
                                                        ...settingsForm,
                                                        agent: {
                                                            name: settingsForm.agent?.name
                                                                ? undefined
                                                                : 'deep-cody', // TODO: update name when finalized.
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="tw-flex tw-flex-1 tw-w-full tw-items-center tw-justify-between">
                                            <h3 className="tw-text-sm tw-inline-flex tw-gap-2">
                                                Terminal Context
                                                {settingsForm.shell?.error && (
                                                    <Badge
                                                        variant="info"
                                                        className="tw-text-xs"
                                                        title={settingsForm.shell?.error}
                                                    >
                                                        Unavailable
                                                    </Badge>
                                                )}
                                            </h3>
                                            <Switch
                                                checked={settingsForm.shell?.enabled}
                                                disabled={!!settings.shell?.error}
                                                onChange={() =>
                                                    setSettingsForm({
                                                        ...settingsForm,
                                                        shell: {
                                                            enabled:
                                                                !!settingsForm.agent?.name &&
                                                                !settingsForm.shell?.enabled,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="tw-text-xs tw-mb-4 tw-text-muted-foreground">
                                            {ToolboxOptionText.terminal}
                                        </div>
                                    </div>
                                </div>
                            </CommandGroup>
                        </CommandList>
                        <footer className="tw-flex tw-justify-end tw-px-6 tw-py-2 tw-border-t tw-border-border tw-bg-muted tw-w-full">
                            <Button onClick={close} variant="secondary" size="xs" disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onSubmit(close)}
                                variant="default"
                                disabled={isLoading}
                                size="xs"
                                className="tw-ml-4"
                            >
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </footer>
                    </Command>
                )}
                popoverRootProps={{ onOpenChange }}
                popoverContentProps={{
                    className: 'tw-w-[350px] !tw-p-0 tw-mr-2',
                    onCloseAutoFocus: event => {
                        event.preventDefault()
                    },
                }}
            >
                <Button variant="ghost" size="none" className="hover:!tw-bg-transparent">
                    {settings.agent?.name ? (
                        <FlaskConicalIcon
                            size={16}
                            strokeWidth={1.25}
                            className="tw-w-8 tw-h-8 tw-text-green-600 tw-drop-shadow-md"
                        />
                    ) : (
                        <FlaskConicalOffIcon
                            size={16}
                            strokeWidth={1.25}
                            className="tw-w-8 tw-h-8 tw-text-muted-foreground"
                        />
                    )}
                </Button>
            </ToolbarPopoverItem>
        </div>
    )
})

const Switch: FC<{ checked?: boolean; onChange?: (checked: boolean) => void; disabled?: boolean }> =
    memo(({ checked = false, onChange, disabled = false }) => {
        return (
            <button
                onClick={e => {
                    e.preventDefault()
                    onChange?.(!checked)
                }}
                className={`tw-relative tw-flex tw-items-center tw-justify-center tw-w-11 tw-h-6 tw-rounded-full tw-ease tw-transform focus:tw-outline-offset-1 focus:tw-outline-2 tw-ring-1 ${
                    checked && !disabled
                        ? 'tw-bg-green-700 tw-ring-green-400'
                        : 'tw-bg-gray-300 tw-ring-gray-400 tw-shadow-sm'
                }`}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
            >
                <div
                    className={`
                tw-absolute tw-left-0 tw-w-5 tw-h-6 tw-rounded-full
                tw-transition-all tw-duration-300 tw-transform tw-shadow-md
                ${checked ? 'tw-translate-x-6 tw-bg-gray-200' : 'tw-translate-x-0 tw-bg-gray-600'}
            `}
                />
            </button>
        )
    })
