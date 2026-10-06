import { useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Radio,
  RadioGroup,
} from '@fluentui/react-components'
import {
  AddRegular,
  DeleteRegular,
  EditRegular,
  InfoRegular,
  SubtractRegular,
} from '@fluentui/react-icons'
import { colors } from '../domain/colors/colors'
import { designs, getDesign } from '../domain/designs/designs'
import { getTotalQuantity, isComplete } from '../domain/garland/rules'
import { MAX_BANDERINES, type GarlandShape } from '../domain/garland/types'
import { useGarlandStore } from '../store/garlandStore'
import { getBanderinSvg } from '../services/assets'
import { buildWhatsAppMessage, getWhatsAppUrl } from '../services/whatsapp'

function BanderinPreview({ shape, designId, color, name, index }: {
  shape: GarlandShape
  designId: string
  color: string
  name?: string
  index: number
}) {
  return (
    <div
      className={`preview-flag preview-flag--${shape}`}
      role="img"
      aria-label={`${getDesign(designId)?.name ?? designId}${name ? ` ${name}` : ''}, ${color}, banderín ${index + 1}`}
    >
      <span
        className="preview-art"
        aria-hidden="true"
        style={{
          '--flag-color': color,
          backgroundColor: color,
          maskImage: `url("${getBanderinSvg(shape, designId)}")`,
          WebkitMaskImage: `url("${getBanderinSvg(shape, designId)}")`,
          maskMode: 'alpha',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
        } as React.CSSProperties}
      />
      {name && <span className="preview-name">{name}</span>}
    </div>
  )
}

export default function App() {
  const items = useGarlandStore((state) => state.items)
  const orderNumber = useGarlandStore((state) => state.orderNumber)
  const addItem = useGarlandStore((state) => state.addItem)
  const increaseQuantity = useGarlandStore((state) => state.increaseQuantity)
  const decreaseQuantity = useGarlandStore((state) => state.decreaseQuantity)
  const updateItem = useGarlandStore((state) => state.updateItem)
  const removeItem = useGarlandStore((state) => state.removeItem)
  const clearGarland = useGarlandStore((state) => state.clearGarland)
  const setOrderNumber = useGarlandStore((state) => state.setOrderNumber)

  const [shape, setShape] = useState<GarlandShape>('semi-circle')
  const [designId, setDesignId] = useState('schnauzer')
  const [colorId, setColorId] = useState('rosa')
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [formError, setFormError] = useState('')
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [editingId, setEditingId] = useState<string | undefined>()

  const total = getTotalQuantity(items)
  const remaining = MAX_BANDERINES - total
  const complete = isComplete(items)
  const availableDesigns = designs.filter((design) => design.supportedShapes.includes(shape))
  const selectedDesign = getDesign(designId)
  const requiresName = selectedDesign?.type === 'name'
  const selectedColor = colors.find((color) => color.id === colorId) ?? colors[0]
  const previewUnits = items.flatMap((item) => Array.from({ length: item.quantity }, (_, index) => ({ item, index })))

  const changeShape = (nextShape: GarlandShape) => {
    setShape(nextShape)
    const nextDesign = designs.find((design) => design.supportedShapes.includes(nextShape))
    if (!designs.find((design) => design.id === designId)?.supportedShapes.includes(nextShape) && nextDesign) {
      setDesignId(nextDesign.id)
    }
  }

  const handleAdd = () => {
    const line = {
      shape,
      designId,
      colorId,
      quantity,
      ...(requiresName ? { customization: { name: customName.trim() } } : {}),
    }
    const error = editingId ? updateItem(editingId, line) : addItem(line)
    setFormError(error ?? '')
    if (!error) {
      setCustomName('')
      setEditingId(undefined)
    }
  }

  const startEditing = (item: typeof items[number]) => {
    setEditingId(item.id)
    setShape(item.shape)
    setDesignId(item.designId)
    setColorId(item.colorId)
    setCustomName(item.customization?.name ?? '')
    setQuantity(item.quantity)
    setFormError('')
    document.querySelector('.builder-column')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!orderNumber.trim()) {
      setOrderError('Ingresa tu número de pedido.')
      return
    }
    const message = buildWhatsAppMessage(orderNumber, items)
    window.open(getWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
    clearGarland()
    setOrderDialogOpen(false)
    setOrderError('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Petu, inicio">petu<span>✳</span></a>
        <span className="topbar-note">PAPEL PICADO HECHO CON CARIÑO</span>
      </header>

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow">UN FESTEJO MUY TUYO</p>
          <h1>Diseña tu<br /><em>guirnalda</em></h1>
        </div>
        <p className="intro-copy">Elige tus banderines favoritos y arma una guirnalda que hable de ustedes.</p>
      </section>

      <section className="workspace" aria-label="Configurador de guirnalda">
        <div className="builder-column">
          <section className="builder-section shape-section">
            <div className="section-heading"><span className="step-index">01</span><h2>Elige la forma</h2></div>
            <RadioGroup layout="horizontal" value={shape} onChange={(_, data) => changeShape(data.value as GarlandShape)} className="shape-options">
              <Radio value="semi-circle" label="Semicírculo" />
              <Radio value="rectangle" label="Rectángulo" />
            </RadioGroup>
          </section>

          <section className="builder-section">
            <div className="section-heading"><span className="step-index">02</span><h2>Escoge un diseño</h2></div>
            <div className="design-grid">
              {availableDesigns.map((design) => (
                <button key={design.id} type="button" className={`design-option ${design.id === designId ? 'is-selected' : ''}`} onClick={() => { setDesignId(design.id); setFormError('') }} aria-pressed={design.id === designId}>
                  <span className="design-dot" />{design.name}
                </button>
              ))}
            </div>
          </section>

          <section className="builder-section customize-section">
            <div className="section-heading"><span className="step-index">03</span><h2>Personaliza</h2></div>
            {requiresName && <label className="field-label" htmlFor="custom-name">Nombre en los banderines</label>}
            {requiresName && <Input id="custom-name" value={customName} maxLength={16} placeholder="Escribe un nombre" onChange={(_, data) => setCustomName(data.value)} />}
            <span className="field-label">Color del papel</span>
            <div className="color-options" role="radiogroup" aria-label="Color del papel">
              {colors.map((color) => (
                <button key={color.id} type="button" className={`color-swatch ${colorId === color.id ? 'is-selected' : ''}`} style={{ '--swatch-color': color.value } as React.CSSProperties} onClick={() => setColorId(color.id)} aria-label={color.name} aria-pressed={colorId === color.id} title={color.name} />
              ))}
              <span className="color-name">{selectedColor.name}</span>
            </div>
            <div className="quantity-row">
              <label className="field-label" htmlFor="quantity">Cantidad</label>
              <Input id="quantity" type="number" min={1} max={Math.max(remaining + (editingId ? items.find((item) => item.id === editingId)?.quantity ?? 0 : 0), 1)} value={String(quantity)} onChange={(_, data) => setQuantity(Math.max(1, Math.min(Number(data.value) || 1, Math.max(remaining + (editingId ? items.find((item) => item.id === editingId)?.quantity ?? 0 : 0), 1))))} />
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <Button appearance="primary" icon={<AddRegular />} onClick={handleAdd} disabled={remaining === 0 && !editingId} className="add-button">
              {editingId ? 'Guardar cambios' : remaining === 0 ? 'Guirnalda completa' : 'Agregar banderines'}
            </Button>
            {editingId && <Button appearance="subtle" onClick={() => { setEditingId(undefined); setFormError('') }}>Cancelar edición</Button>}
            <p className="remaining-hint">{remaining === 0 ? 'Ya tienes los 10 banderines.' : `Puedes agregar ${remaining} ${remaining === 1 ? 'banderín' : 'banderines'} más.`}</p>
          </section>
        </div>

        <aside className="preview-column">
          <div className="preview-heading">
            <div><p className="eyebrow">ASÍ VA QUEDANDO</p><h2>Tu guirnalda</h2></div>
            <Badge appearance={complete ? 'filled' : 'outline'} color={complete ? 'success' : 'informative'}>{total} / {MAX_BANDERINES}</Badge>
          </div>
          <div className={`preview-stage ${items.length === 0 ? 'is-empty' : ''}`}>
            {previewUnits.length === 0
              ? <p className="empty-message">Tus ideas empiezan aquí.<br /><span>Agrega tus primeros banderines.</span></p>
              : <div className="preview-units">{previewUnits.map(({ item, index }, unitIndex) => (
                <BanderinPreview key={`${item.id}-${index}`} shape={item.shape} designId={item.designId} color={colors.find((color) => color.id === item.colorId)?.value ?? '#ddd'} name={item.customization?.name} index={unitIndex} />
              ))}</div>}
          </div>
          <div className="progress-track" aria-label={`${total} de ${MAX_BANDERINES} banderines`}><span style={{ width: `${total * 10}%` }} /></div>
          <p className="progress-copy">{complete ? '¡Tu guirnalda está completa!' : total === 0 ? '10 espacios para celebrar' : `Te ${remaining === 1 ? 'falta' : 'faltan'} ${remaining} ${remaining === 1 ? 'banderín' : 'banderines'}`}</p>

          <div className="summary">
            <div className="summary-heading"><h3>Lo que has elegido</h3>{items.length > 0 && <span>{items.length} {items.length === 1 ? 'diseño' : 'diseños'}</span>}</div>
            {items.length === 0
              ? <p className="summary-empty">Tu selección aparecerá aquí.</p>
              : <ul className="summary-list">{items.map((item) => {
                const design = getDesign(item.designId)
                const color = colors.find((candidate) => candidate.id === item.colorId)
                return <li className="summary-item" key={item.id}>
                  <span className="summary-color" style={{ backgroundColor: color?.value }} />
                  <div className="summary-description"><strong>{design?.name}{item.customization?.name ? ` “${item.customization.name}”` : ''}</strong><span>{color?.name} · {item.shape === 'semi-circle' ? 'Semicírculo' : 'Rectángulo'}</span></div>
                  <div className="line-controls">
                    <Button size="small" appearance="subtle" icon={<SubtractRegular />} aria-label={`Quitar uno de ${design?.name}`} onClick={() => decreaseQuantity(item.id)} />
                    <span>{item.quantity}</span>
                    <Button size="small" appearance="subtle" icon={<AddRegular />} aria-label={`Agregar uno de ${design?.name}`} onClick={() => increaseQuantity(item.id)} disabled={total >= MAX_BANDERINES} />
                  </div>
                  <Button size="small" appearance="subtle" icon={<EditRegular />} aria-label={`Editar ${design?.name}`} onClick={() => startEditing(item)} />
                  <Button size="small" appearance="subtle" icon={<DeleteRegular />} aria-label={`Eliminar ${design?.name}`} onClick={() => removeItem(item.id)} />
                </li>
              })}</ul>}
          </div>

          <Button appearance="primary" size="large" className="continue-button" onClick={() => setOrderDialogOpen(true)} disabled={!complete}>Continuar a WhatsApp <span aria-hidden="true">↗</span></Button>
          {!complete && <p className="continue-hint">Completa los 10 banderines para continuar.</p>}
        </aside>
      </section>

      <footer className="footer-note">HECHO A MANO, HECHO PARA CELEBRAR <span>✳</span></footer>

      <Dialog open={orderDialogOpen} onOpenChange={(_, data) => { setOrderDialogOpen(data.open); setOrderError('') }}>
        <DialogSurface>
          <form onSubmit={handleWhatsApp}>
            <DialogBody>
              <DialogTitle>Número de pedido</DialogTitle>
              <DialogContent>
                <div className="order-label-row">
                  <label htmlFor="order-number">Escribe el número asociado a tu compra.</label>
                  <Popover positioning={{ position: 'above', align: 'end' }}>
                    <PopoverTrigger disableButtonEnhancement>
                      <Button appearance="subtle" icon={<InfoRegular />} aria-label="¿Dónde encuentro mi número de pedido?" />
                    </PopoverTrigger>
                    <PopoverSurface className="order-info">Tu número de pedido fue enviado al correo electrónico que utilizaste para realizar tu compra en LolaPay. Si no lo encuentras, revisa también tu carpeta de spam o correo no deseado.</PopoverSurface>
                  </Popover>
                </div>
                <Input id="order-number" autoFocus value={orderNumber} placeholder="Número de pedido" onChange={(_, data) => { setOrderNumber(data.value); setOrderError('') }} />
                {orderError && <p className="form-error" role="alert">{orderError}</p>}
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setOrderDialogOpen(false)}>Cancelar</Button>
                <Button appearance="primary" type="submit">Abrir WhatsApp</Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </main>
  )
}