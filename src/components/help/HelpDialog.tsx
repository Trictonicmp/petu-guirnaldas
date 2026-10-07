import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from '@fluentui/react-components'
import { helpTopics } from '../../domain/help/helpTopics'

type HelpDialogProps = {
  open: boolean
  onClose: () => void
  onReplayTutorial: () => void
}

export default function HelpDialog({ open, onClose, onReplayTutorial }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onClose() }}>
      <DialogSurface className="help-surface">
        <DialogBody>
          <DialogTitle>Ayuda</DialogTitle>
          <DialogContent>
            <div className="help-topics">
              {helpTopics.map((topic) => (
                <section key={topic.id} className="help-topic">
                  <h2>{topic.title}</h2>
                  <p>{topic.description}</p>
                </section>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>Cerrar</Button>
            <Button appearance="primary" onClick={onReplayTutorial}>Ver tutorial nuevamente</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
