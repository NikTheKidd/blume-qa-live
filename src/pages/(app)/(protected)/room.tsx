import { useEffect, useState } from 'react'
import { useQuery, useMutations, useUser } from 'deepspace'
import { Button } from '@/components/ui'

type Room = { title: string; code: string }
type Question = { roomCode: string; text: string; authorName: string; status: string }
type Vote = { questionId: string; roomCode: string }
type Mod = { questionId: string; roomCode: string; action: string }

export default function RoomPage() {
  const { user } = useUser()
  const me = user?.id

  const [joined, setJoined] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(true)

  const rooms = useQuery<Room>('rooms')
  const questions = useQuery<Question>('questions')
  const votes = useQuery<Vote>('votes')
  const mods = useQuery<Mod>('moderation')
  const roomM = useMutations<Room>('rooms')
  const qM = useMutations<Question>('questions')
  const vM = useMutations<Vote>('votes')
  const modM = useMutations<Mod>('moderation')

  const room = rooms.records.find((r) => r.data.code === joined)
  const isHost = !!room && !!me && room.createdBy === me

  // TEMP: confirm the ids line up (logs once per change, not every render)
  useEffect(() => {
    if (joined) console.log('ids', { me, host: room?.createdBy })
  }, [joined, me, room?.createdBy])

  // Only moderation records created by the room's host count. Latest one wins.
  const status = new Map<string, string>()
  mods.records
    .filter((m) => m.data.roomCode === joined && room && m.createdBy === room.createdBy)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((m) => status.set(m.data.questionId, m.data.action))

  const list = questions.records
    .filter((q) => q.data.roomCode === joined && status.get(q.recordId) !== 'hidden')
    .map((q) => {
      const qv = votes.records.filter((v) => v.data.questionId === q.recordId)
      return {
        q,
        count: new Set(qv.map((v) => v.createdBy)).size,
        myVote: qv.find((v) => v.createdBy === me),
        answered: status.get(q.recordId) === 'answered',
      }
    })
    .sort((a, b) => Number(a.answered) - Number(b.answered) || b.count - a.count)

  const createRoom = () => {
    const c = Math.random().toString(36).slice(2, 6).toUpperCase()
    roomM.create({ title: title.trim(), code: c })
    setJoined(c)
  }

  const moderate = (questionId: string, action: string) =>
    modM.create({ questionId, roomCode: joined!, action })

  if (!joined) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Q&amp;A</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask questions, upvote the ones you want answered, and watch the list reorder live.
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Host a room</h2>
          <input
            className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Talk or event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button className="w-full" disabled={!title.trim()} onClick={createRoom}>
            Create room
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Join a room</h2>
          <input
            className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
            placeholder="Room code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          />
          <Button
            variant="secondary"
            className="w-full"
            disabled={!codeInput.trim()}
            onClick={() => setJoined(codeInput.trim())}
          >
            Join
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{room?.data.title ?? 'Room'}</h1>
        <div className="flex items-center gap-2">
          {isHost && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Host</span>
          )}
          <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm">{joined}</span>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <textarea
          className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Ask a question"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            Ask anonymously
          </label>
          <Button
            disabled={!text.trim()}
            onClick={() => {
              qM.create({
                roomCode: joined,
                text: text.trim(),
                authorName: anon ? 'Anonymous' : (user?.name ?? 'Attendee'),
                status: 'open',
              })
              setText('')
            }}
          >
            Submit
          </Button>
        </div>
      </section>

      {list.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No questions yet. Be the first to ask.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {list.map(({ q, count, myVote, answered }) => (
          <li
            key={q.recordId}
            className={`rounded-lg border border-border bg-card p-4 ${answered ? 'opacity-50' : ''}`}
          >
            <p>{q.data.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {q.data.authorName}
              {answered ? ' Â· answered' : ''}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant={myVote ? 'default' : 'secondary'}
                onClick={() =>
                  myVote
                    ? vM.remove(myVote.recordId)
                    : vM.create({ questionId: q.recordId, roomCode: joined })
                }
              >
                {myVote ? 'Voted' : 'Upvote'} ({count})
              </Button>
              {isHost && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => moderate(q.recordId, answered ? 'open' : 'answered')}
                  >
                    {answered ? 'Reopen' : 'Answered'}
                  </Button>
                  <Button variant="secondary" onClick={() => moderate(q.recordId, 'hidden')}>
                    Hide
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
