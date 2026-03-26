'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Step1Workspace from './Step1Workspace'
import Step2Project from './Step2Project'
import Step3Invite from './Step3Invite'

interface Props {
  workspace: { id: string; name: string; slug: string }
  userId: string
}

export default function OnboardingWizard({ workspace, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [_projectId, setProjectId] = useState<string | null>(null)

  function handleStep1Done() {
    setStep(2)
  }

  function handleStep2Done(id: string) {
    setProjectId(id)
    setStep(3)
  }

  function handleStep3Done() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Fortschrittsanzeige */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${s < step ? 'bg-green-500 text-white' :
                    s === step ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'}`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 flex-1 w-24 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Workspace</span>
            <span>Projekt</span>
            <span>Team</span>
          </div>
        </div>

        {step === 1 && (
          <Step1Workspace workspace={workspace} onDone={handleStep1Done} />
        )}
        {step === 2 && (
          <Step2Project workspaceId={workspace.id} userId={userId} onDone={handleStep2Done} />
        )}
        {step === 3 && (
          <Step3Invite workspaceId={workspace.id} onDone={handleStep3Done} />
        )}
      </div>
    </div>
  )
}
