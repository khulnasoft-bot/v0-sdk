'use client'

import type { ReactNode } from 'react'
import {
  PromptInputActionAddAttachments,
  PromptInputActionMenuItem,
} from '@/components/ai-elements/prompt-input'
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputSpeechButton,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { useRef } from 'react'
import type { FileUIPart } from 'ai'
import { Loader } from '@/components/ai-elements/loader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { AVAILABLE_MODELS, MODEL_LABELS, type ModelType } from '@/lib/hooks/useSettings'
import { PlusIcon, ArrowUpIcon, ChevronDownIcon, StopIcon, V0LogoIcon, CodeIcon } from '@/lib/icons'

export function PromptBox({
  onSubmit,
  onStop,
  isSubmitting = false,
  isStopping = false,
  isStreaming = false,
  placeholder = 'Describe what you want to build...',
  model,
  onModelChange,
  autoFocus = false,
  compact = false,
  className,
  attachmentMenu,
}: {
  onSubmit?: (text: string, files: FileUIPart[]) => void | Promise<void>
  onStop?: () => void | Promise<void>
  isSubmitting?: boolean
  isStopping?: boolean
  isStreaming?: boolean
  placeholder?: string
  model: ModelType
  onModelChange: (model: ModelType) => void
  autoFocus?: boolean
  compact?: boolean
  className?: string
  attachmentMenu?: ReactNode
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim()
    if (!text || !onSubmit || isSubmitting) return
    return onSubmit(text, message.files)
  }

  return (
    <PromptInput
      className={cn('rounded-2xl border-border bg-card shadow-sm', className)}
      onSubmit={handleSubmit}
    >
      <PromptInputBody>
        <PromptInputTextarea
          autoFocus={autoFocus}
          className={cn(
            'min-h-[52px] bg-transparent px-4 pt-3.5 text-base',
            compact && 'min-h-[44px] px-3 pt-3 text-sm',
          )}
          disabled={isSubmitting}
          placeholder={placeholder}
          ref={textareaRef}
        />
      </PromptInputBody>
      <PromptInputAttachments>
        {(attachment) => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>
      <PromptInputFooter className="px-2 pb-2">
        <PromptInputTools>
          {attachmentMenu ?? (
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger aria-label="Add attachment" disabled={isSubmitting}>
                <PlusIcon className="size-4" />
              </PromptInputActionMenuTrigger>
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments disabled={isSubmitting} />
                <PromptInputActionMenuItem
                  disabled={isSubmitting}
                  onClick={() => {
                    window.location.href = '/api/integrations/figma/connect'
                  }}
                >
                  <CodeIcon className="mr-2 size-4" />
                  Import from Figma
                </PromptInputActionMenuItem>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          )}

          <PromptInputSpeechButton
            aria-label="Dictate prompt"
            disabled={isSubmitting}
            textareaRef={textareaRef}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PromptInputButton className="gap-1.5" disabled={isSubmitting}>
                <V0LogoIcon className="size-4" />
                <span>{MODEL_LABELS[model]}</span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </PromptInputButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {AVAILABLE_MODELS.map((m) => (
                <DropdownMenuItem key={m} onClick={() => onModelChange(m)}>
                  <V0LogoIcon className="size-4" />
                  {MODEL_LABELS[m]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PromptInputTools>

        <PromptInputTools>
          <PromptInputSubmit
            aria-label={isStreaming ? 'Stop generating' : 'Send message'}
            className="size-8 rounded-lg"
            disabled={isStreaming ? !onStop || isStopping : !onSubmit || isSubmitting}
            onClick={isStreaming ? () => onStop?.() : undefined}
            type={isStreaming ? 'button' : 'submit'}
          >
            {isStopping || (isSubmitting && !isStreaming) ? (
              <Loader size={16} />
            ) : isStreaming ? (
              <StopIcon className="size-4" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </PromptInputSubmit>
        </PromptInputTools>
      </PromptInputFooter>
    </PromptInput>
  )
}
