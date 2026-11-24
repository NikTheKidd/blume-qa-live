import { useState } from 'react'
import { useQuery, useMutations } from 'deepspace'
import { Button } from '@/components/ui'

type Room = { title: string; code: string }
type Question = { roomCode: string; text: string; authorName: string; status: string }
type Vote = { questionId: string; roomCode: string }

export default function RoomPage() {
  const [joined, setJoined] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(true)

  const rooms = useQuery<Room>('rooms')
  const questions = useQuery<Question>('questions')
  const votes = useQuery<Vote>('votes')
  const roomM = useMutations<Room>('rooms')
  const qM = useMutations<Question>('questions')
  const vM = useMutations<Vote>('votes')

  // TEMP: shows what fields a record really has (check the browser console)
  if (rooms.records[0]) console.log('room record shape:', rooms.records[0])

  const room = rooms.records.find((r) => r.data.code === joined)
  const list = questions.records
    .filter((q) => q.data.roomCode === joined && q.data.status !== 'hidden')
    .map((q) => ({
      q,
      count: votes.records.filter((v) => v.data.questionId === q.recordId).length,
    }))
    .sort((a, b) => b.count - a.count)

  const createRoom = () => {
    const c = Math.random().toString(36).slice(2, 6).toUpperCase()
    roomM.create({ title: title.trim(), code: c })
    setJoined(c)
  }

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
        <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm">{joined}</span>
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
                authorName: anon ? 'Anonymous' : 'Attendee',
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
        {list.map(({ q, count }) => (
          <li
            key={q.recordId}
            className={`rounded-lg border border-border bg-card p-4 ${
              q.data.status === 'answered' ? 'opacity-50' : ''
            }`}
          >
            <p>{q.data.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">{q.data.authorName}</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => vM.create({ questionId: q.recordId, roomCode: joined })}
              >
                Upvote ({count})
              </Button>
              <Button variant="secondary" onClick={() => qM.put(q.recordId, { status: 'answered' })}>
                Answered
              </Button>
              <Button variant="secondary" onClick={() => qM.put(q.recordId, { status: 'hidden' })}>
                Hide
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}