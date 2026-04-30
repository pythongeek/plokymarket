# Expert Panel, Dispute Tribunal এবং External Oracle - Part 3

## 🎓 3. Expert Panel System ("বিশিষ্ট ব্যক্তি")

### Expert Management Dashboard

**`app/admin/experts/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Award, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react'

interface Expert {
  id: string
  expert_name: string
  specializations: string[]
  total_votes: number
  correct_votes: number
  incorrect_votes: number
  accuracy_rate: number
  expert_rating: number
  is_verified: boolean
  is_active: boolean
}

export default function ExpertManagementPage() {
  const supabase = createClient()
  const [experts, setExperts] = useState<Expert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExperts()
  }, [])

  const loadExperts = async () => {
    const { data, error } = await supabase
      .from('expert_panel')
      .select('*')
      .order('accuracy_rate', { ascending: false })

    if (data) setExperts(data)
    setIsLoading(false)
  }

  // Expert যোগ করুন
  const addExpert = async (formData: any) => {
    const { error } = await supabase
      .from('expert_panel')
      .insert({
        user_id: formData.user_id,
        expert_name: formData.name,
        specializations: formData.specializations,
        credentials: formData.credentials,
        bio: formData.bio,
        is_verified: false,
      })

    if (error) {
      toast.error('Expert যোগ করতে ব্যর্থ')
    } else {
      toast.success('Expert সফলভাবে যোগ করা হয়েছে')
      loadExperts()
    }
  }

  // Expert Verify করুন
  const verifyExpert = async (expertId: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('expert_panel')
      .update({
        is_verified: true,
        verified_by: user?.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', expertId)

    if (error) {
      toast.error('Verification ব্যর্থ')
    } else {
      toast.success('Expert verified!')
      loadExperts()
    }
  }

  // Expert Deactivate করুন (যদি accuracy খুব কম)
  const deactivateExpert = async (expertId: string, reason: string) => {
    const { error } = await supabase
      .from('expert_panel')
      .update({
        is_active: false,
        availability_status: 'unavailable'
      })
      .eq('id', expertId)

    if (error) {
      toast.error('Deactivation ব্যর্থ')
    } else {
      // Activity log
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user?.id,
          action_type: 'remove_expert',
          resource_type: 'expert',
          resource_id: expertId,
          reason
        })

      toast.success('Expert deactivated')
      loadExperts()
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expert Panel Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            বিশেষজ্ঞদের পরিচালনা করুন এবং তাদের পারফরম্যান্স ট্র্যাক করুন
          </p>
        </div>
        <Button>
          <UserPlus className="w-5 h-5 mr-2" />
          নতুন Expert যোগ করুন
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Experts</p>
              <p className="text-3xl font-bold mt-1">{experts.length}</p>
            </div>
            <Award className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
              <p className="text-3xl font-bold mt-1">
                {experts.filter(e => e.is_verified).length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-3xl font-bold mt-1">
                {experts.filter(e => e.is_active).length}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</p>
              <p className="text-3xl font-bold mt-1">
                {experts.length > 0
                  ? (experts.reduce((sum, e) => sum + e.accuracy_rate, 0) / experts.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <Star className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Experts Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Specializations
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Votes
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Accuracy
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Rating
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {experts.map((expert) => (
              <tr key={expert.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {expert.expert_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{expert.expert_name}</div>
                      <div className="text-sm text-gray-500">ID: {expert.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {expert.specializations.slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {expert.specializations.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{expert.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="space-y-1">
                    <div className="font-semibold">{expert.total_votes}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-green-600">{expert.correct_votes}✓</span>
                      {' / '}
                      <span className="text-red-600">{expert.incorrect_votes}✗</span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                    ${expert.accuracy_rate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      expert.accuracy_rate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}
                  `}>
                    {expert.accuracy_rate.toFixed(1)}%
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">
                      {expert.expert_rating.toFixed(2)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {expert.is_verified && (
                      <CheckCircle className="w-5 h-5 text-green-500" title="Verified" />
                    )}
                    {expert.is_active ? (
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!expert.is_verified && (
                      <Button
                        size="sm"
                        onClick={() => verifyExpert(expert.id)}
                      >
                        Verify
                      </Button>
                    )}
                    {expert.is_active && expert.accuracy_rate < 50 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deactivateExpert(expert.id, 'Low accuracy (<50%)')}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
```

### Expert Voting Interface

**`app/admin/events/[eventId]/expert-vote/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, X, FileText, Users } from 'lucide-react'

export default function ExpertVotingPage({ params }: { params: { eventId: string } }) {
  const supabase = createClient()
  const [event, setEvent] = useState<any>(null)
  const [experts, setExperts] = useState<any[]>([])
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [votes, setVotes] = useState<Record<string, {
    outcome: 1 | 2
    reasoning: string
    confidence: number
  }>>({})

  useEffect(() => {
    loadEventAndExperts()
  }, [])

  const loadEventAndExperts = async () => {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.eventId)
      .single()

    setEvent(eventData)

    // Load relevant experts based on event category
    if (eventData) {
      const { data: expertsData } = await supabase
        .from('expert_panel')
        .select('*')
        .contains('specializations', [eventData.category])
        .eq('is_verified', true)
        .eq('is_active', true)
        .gte('accuracy_rate', 60) // শুধুমাত্র 60%+ accuracy
        .order('accuracy_rate', { ascending: false })
        .limit(10)

      setExperts(expertsData || [])
    }
  }

  // Expert assign করুন
  const assignExperts = async () => {
    const { error } = await supabase
      .from('resolution_systems')
      .update({
        assigned_experts: selectedExperts,
        resolution_status: 'in_progress'
      })
      .eq('event_id', params.eventId)

    if (error) {
      toast.error('Experts assign করতে ব্যর্থ')
    } else {
      toast.success(`${selectedExperts.length}জন Expert assign করা হয়েছে`)
      // Send notifications to experts
      for (const expertId of selectedExperts) {
        await supabase
          .from('notifications')
          .insert({
            user_id: expertId,
            type: 'expert_assignment',
            title: 'New Event for Expert Review',
            message: `You have been assigned to review: ${event.name}`,
            related_id: params.eventId
          })
      }
    }
  }

  // Vote submit করুন
  const submitVote = async (expertId: string) => {
    const vote = votes[expertId]
    if (!vote) return

    const { error } = await supabase
      .from('resolution_systems')
      .update({
        expert_votes: supabase.rpc('append_expert_vote', {
          event_id: params.eventId,
          expert_id: expertId,
          vote_data: {
            outcome: vote.outcome,
            reasoning: vote.reasoning,
            confidence: vote.confidence,
            voted_at: new Date().toISOString()
          }
        })
      })
      .eq('event_id', params.eventId)

    if (error) {
      toast.error('Vote submit করতে ব্যর্থ')
    } else {
      // Expert stats আপডেট করুন
      await supabase
        .from('expert_panel')
        .update({
          total_votes: supabase.rpc('increment', { row_id: expertId }),
          last_vote_at: new Date().toISOString()
        })
        .eq('id', expertId)

      toast.success('Vote recorded!')
    }
  }

  // Consensus calculate করুন
  const calculateConsensus = async () => {
    const { data: resolution } = await supabase
      .from('resolution_systems')
      .select('expert_votes, expert_consensus_threshold')
      .eq('event_id', params.eventId)
      .single()

    if (!resolution || !resolution.expert_votes) return

    const expertVotes = resolution.expert_votes as any[]
    const yesVotes = expertVotes.filter(v => v.outcome === 1).length
    const noVotes = expertVotes.filter(v => v.outcome === 2).length
    const totalVotes = expertVotes.length

    const yesPercentage = yesVotes / totalVotes
    const noPercentage = noVotes / totalVotes

    const threshold = resolution.expert_consensus_threshold || 0.75

    if (yesPercentage >= threshold) {
      // YES consensus reached
      await resolveWithConsensus(1, yesPercentage)
    } else if (noPercentage >= threshold) {
      // NO consensus reached
      await resolveWithConsensus(2, noPercentage)
    } else {
      toast.error(`No consensus yet. Need ${(threshold * 100).toFixed(0)}% agreement.`)
    }
  }

  const resolveWithConsensus = async (outcome: 1 | 2, consensus: number) => {
    const { error } = await supabase
      .from('events')
      .update({
        trading_status: 'resolved',
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
        resolution_source: 'expert_panel'
      })
      .eq('id', params.eventId)

    if (error) {
      toast.error('Resolution ব্যর্থ')
    } else {
      await supabase
        .from('resolution_systems')
        .update({
          resolution_status: 'resolved',
          proposed_outcome: outcome,
          confidence_level: consensus * 100,
          resolved_at: new Date().toISOString()
        })
        .eq('event_id', params.eventId)

      // Update expert stats (correct/incorrect)
      // This would be done after verifying the actual outcome

      toast.success(`✅ Event resolved by expert consensus (${(consensus * 100).toFixed(1)}%)`)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Users className="w-8 h-8" />
        Expert Panel Voting
      </h1>

      {event && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{event.question}</p>
          <div className="flex gap-2 mt-4">
            <Badge>{event.category}</Badge>
            <Badge variant="outline">{event.subcategory}</Badge>
          </div>
        </Card>
      )}

      {/* Expert Selection */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Experts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {experts.map((expert) => (
            <div
              key={expert.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${selectedExperts.includes(expert.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'hover:border-gray-400'}
              `}
              onClick={() => {
                setSelectedExperts(prev =>
                  prev.includes(expert.id)
                    ? prev.filter(id => id !== expert.id)
                    : [...prev, expert.id]
                )
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{expert.expert_name}</div>
                <div className="text-sm text-gray-500">
                  {expert.accuracy_rate.toFixed(1)}% accuracy
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {expert.specializations.map((spec: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={assignExperts}
          disabled={selectedExperts.length === 0}
        >
          Assign {selectedExperts.length} Experts
        </Button>
      </Card>

      {/* Voting Interface (for assigned experts) */}
      {selectedExperts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Expert Votes</h2>
          
          <div className="space-y-6">
            {selectedExperts.map((expertId) => {
              const expert = experts.find(e => e.id === expertId)
              if (!expert) return null

              return (
                <div key={expertId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">{expert.expert_name}</div>
                    <Badge>Accuracy: {expert.accuracy_rate.toFixed(1)}%</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      variant={votes[expertId]?.outcome === 1 ? 'default' : 'outline'}
                      onClick={() => setVotes({
                        ...votes,
                        [expertId]: {
                          ...votes[expertId],
                          outcome: 1
                        }
                      })}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      YES
                    </Button>
                    <Button
                      variant={votes[expertId]?.outcome === 2 ? 'default' : 'outline'}
                      onClick={() => setVotes({
                        ...votes,
                        [expertId]: {
                          ...votes[expertId],
                          outcome: 2
                        }
                      })}
                    >
                      <X className="w-4 h-4 mr-2" />
                      NO
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Reasoning..."
                    value={votes[expertId]?.reasoning || ''}
                    onChange={(e) => setVotes({
                      ...votes,
                      [expertId]: {
                        ...votes[expertId],
                        reasoning: e.target.value
                      }
                    })}
                    rows={3}
                    className="mb-3"
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      Confidence: {votes[expertId]?.confidence || 50}%
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={votes[expertId]?.confidence || 50}
                        onChange={(e) => setVotes({
                          ...votes,
                          [expertId]: {
                            ...votes[expertId],
                            confidence: parseInt(e.target.value)
                          }
                        })}
                        className="w-32 ml-3"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => submitVote(expertId)}
                      disabled={!votes[expertId]?.outcome || !votes[expertId]?.reasoning}
                    >
                      Submit Vote
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            onClick={calculateConsensus}
          >
            Calculate Consensus & Resolve
          </Button>
        </Card>
      )}
    </div>
  )
}
```

---

## ⚖️ 4. Dispute Tribunal ("সালিশ")

### Dispute Submission Interface

**`app/events/[eventId]/dispute/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Upload, DollarSign } from 'lucide-react'

const BOND_AMOUNT = 100 // USDC

export default function DisputeSubmissionPage({ params }: { params: { eventId: string } }) {
  const supabase = createClient()
  const [disputeType, setDisputeType] = useState('wrong_outcome')
  const [reason, setReason] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('বিরোধের কারণ লিখুন')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check user balance
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('usdc_balance')
        .eq('id', user?.id)
        .single()

      if (!profile || profile.usdc_balance < BOND_AMOUNT) {
        throw new Error('Insufficient balance for bond deposit')
      }

      // Lock bond amount
      await supabase
        .from('user_profiles')
        .update({
          usdc_balance: profile.usdc_balance - BOND_AMOUNT,
          locked_balance: supabase.rpc('increment', { amount: BOND_AMOUNT })
        })
        .eq('id', user?.id)

      // Create dispute record
      const { data: dispute, error } = await supabase
        .from('dispute_records')
        .insert({
          event_id: params.eventId,
          disputed_by: user?.id,
          dispute_type: disputeType,
          dispute_reason: reason,
          evidence_urls: evidenceUrls,
          bond_amount: BOND_AMOUNT,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Notify admins
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_pro', true)

      if (admins) {
        for (const admin of admins) {
          await supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              type: 'dispute_filed',
              title: 'New Dispute Filed',
              message: `A dispute has been filed for event: ${params.eventId}`,
              related_id: dispute.id
            })
        }
      }

      toast.success('✅ বিরোধ জমা দেওয়া হয়েছে। ${BOND_AMOUNT} USDC bond locked.')
      
    } catch (error: any) {
      toast.error(error.message || 'Dispute submit করতে ব্যর্থ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">File a Dispute</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Challenge the resolution of this event
            </p>
          </div>
        </div>

        {/* Bond Warning */}
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                Bond Requirement
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Filing a dispute requires a ${BOND_AMOUNT} USDC security deposit.
                If your dispute is accepted, the bond will be returned.
                If rejected or found to be spam, the bond will be forfeited.
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Dispute Type *
          </label>
          <select
            value={disputeType}
            onChange={(e) => setDisputeType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="wrong_outcome">Wrong Outcome</option>
            <option value="premature_resolution">Premature Resolution</option>
            <option value="technical_error">Technical Error</option>
            <option value="oracle_failure">Oracle Failure</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Detailed Reason *
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you believe the resolution is incorrect. Be specific and provide evidence."
            rows={6}
          />
        </div>

        {/* Evidence URLs */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Evidence (URLs to supporting documents, news articles, etc.)
          </label>
          {/* TagInput or similar for multiple URLs */}
          <Input
            type="url"
            placeholder="https://example.com/evidence"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                setEvidenceUrls([...evidenceUrls, e.currentTarget.value])
                e.currentTarget.value = ''
              }
            }}
          />
          <div className="mt-2 space-y-1">
            {evidenceUrls.map((url, i) => (
              <div key={i} className="text-sm text-blue-600 hover:underline">
                {url}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : `Submit Dispute (Lock $${BOND_AMOUNT} USDC)`}
        </Button>
      </Card>
    </div>
  )
}
```

চলবে পরের ফাইলে...
