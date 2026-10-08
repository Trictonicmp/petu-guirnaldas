import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  ToggleButton,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
import { colors } from "../../domain/colors/colors";
import { designs } from "../../domain/designs/designs";
import { otherDesignHint } from "../../domain/help/helpTopics";
import type { GarlandItem, GarlandShape } from "../../domain/garland/types";
import { getDesignPreview } from "../../services/assets";
import { useOnboarding, useOnboardingTarget } from "../onboarding/OnboardingProvider";

function DesignPreview({
  designId,
  name,
  type,
}: {
  designId: string;
  name: string;
  type: (typeof designs)[number]["type"];
}) {
  const [unavailable, setUnavailable] = useState(false);
  const src = getDesignPreview(designId, type);

  if (!src || unavailable) {
    return (
      <span className="design-preview-fallback" aria-hidden="true">
        {name.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="design-preview-image"
      src={src}
      alt=""
      onError={() => setUnavailable(true)}
    />
  );
}

type BanderinConfiguratorProps = {
  open: boolean;
  position: number;
  editing: boolean;
  shape: GarlandShape;
  designId: string;
  colorId: string;
  customName: string;
  error: string;
  onShapeChange: (shape: GarlandShape) => void;
  onDesignChange: (designId: string) => void;
  onColorChange: (colorId: string) => void;
  onNameChange: (name: string) => void;
  onSave: (item: Omit<GarlandItem, "id">) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function BanderinConfigurator({
  open,
  position,
  editing,
  shape,
  designId,
  colorId,
  customName,
  error,
  onShapeChange,
  onDesignChange,
  onColorChange,
  onNameChange,
  onSave,
  onDelete,
  onClose,
}: BanderinConfiguratorProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const contentRef = useRef<HTMLDivElement>(null);
  const onboarding = useOnboarding();
  const shapeTargetRef = useOnboardingTarget("shape");
  const designTargetRef = useOnboardingTarget("design");
  const colorTargetRef = useOnboardingTarget("color");
  const saveTargetRef = useOnboardingTarget("save");
  const availableDesigns = designs.filter((design) =>
    design.supportedShapes.includes(shape),
  );
  const selectedDesign = availableDesigns.find(
    (design) => design.id === designId,
  );

  useEffect(() => {
    if (open) {
      setStep(0);
      setDirection("forward");
    }
  }, [open, position]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const moveToStep = (nextStep: number) => {
    setDirection(nextStep > step ? "forward" : "backward");
    setStep(nextStep);
    if (!editing && ["shape", "design", "color"].includes(onboarding.step ?? "")) {
      onboarding.setStep((["shape", "design", "color"] as const)[nextStep]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 2) {
      moveToStep(step + 1);
      return;
    }
    onSave({
      shape,
      designId,
      colorId,
      ...(selectedDesign?.type === "name" || selectedDesign?.type === "other"
        ? { customization: { name: customName.trim() } }
        : {}),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface className="configurator-surface">
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>
              {editing
                ? `Edita el banderín ${position}`
                : `Agrega el banderín ${position}`}
            </DialogTitle>
            <DialogContent ref={contentRef}>
              <div
                className="configurator-step-indicator"
                aria-label={`Paso ${step + 1} de 3`}
              >
                {["Forma", "Diseño", "Color"].map((label, index) => (
                  <span
                    key={label}
                    className={
                      index === step
                        ? "is-current"
                        : index < step
                          ? "is-complete"
                          : ""
                    }
                  >
                    <i>{index + 1}</i>
                    {label}
                  </span>
                ))}
              </div>
              <div
                key={step}
                className={`configurator-step-panel slide-${direction}`}
              >
                {step === 0 && (
                  <section className="builder-section shape-section">
                    <div className="section-heading">
                      <span className="step-index">01</span>
                      <h2>Elige la forma</h2>
                    </div>
                    <div
                      className="shape-options"
                      ref={shapeTargetRef}
                      role="group"
                      aria-label="Forma del banderín"
                    >
                      <ToggleButton
                        type="button"
                        className="shape-toggle"
                        checked={shape === "semi-circle"}
                        onClick={() => onShapeChange("semi-circle")}
                        aria-label="Semicírculo"
                      >
                        <img src="/assets/semi-circulo-formabase.svg" alt="" />
                        <span>Semicírculo</span>
                      </ToggleButton>
                      <ToggleButton
                        type="button"
                        className="shape-toggle"
                        checked={shape === "rectangle"}
                        onClick={() => onShapeChange("rectangle")}
                        aria-label="Rectángulo"
                      >
                        <img src="/assets/tradicional-formabase.svg" alt="" />
                        <span>Rectángulo</span>
                      </ToggleButton>
                    </div>
                  </section>
                )}

                {step === 1 && (
                  <section className="builder-section design-step">
                    <div className="section-heading">
                      <span className="step-index">02</span>
                      <h2>Escoge un diseño</h2>
                    </div>
                    <p className="design-step-hint" role="note">{otherDesignHint}</p>
                    <div className="design-grid" ref={designTargetRef}>
                      {availableDesigns.map((design) => (
                        <ToggleButton
                          key={design.id}
                          type="button"
                          className="design-option"
                          checked={design.id === designId}
                          onClick={() => onDesignChange(design.id)}
                          aria-label={design.name}
                        >
                          <DesignPreview
                            designId={design.id}
                            name={design.name}
                            type={design.type}
                          />
                          <span>{design.name}</span>
                        </ToggleButton>
                      ))}
                    </div>
                  </section>
                )}

                {step === 2 && (
                  <section className="builder-section customize-section">
                    <div className="section-heading">
                      <span className="step-index">03</span>
                      <h2>Color y personalización</h2>
                    </div>
                    {selectedDesign?.type === "name" && (
                      <>
                        <label className="field-label" htmlFor="custom-name">
                          Nombre en los banderines
                        </label>
                        <Input
                          id="custom-name"
                          value={customName}
                          maxLength={35}
                          placeholder="Escribe un nombre"
                          onChange={(_, data) => onNameChange(data.value)}
                        />
                      </>
                    )}
                    {selectedDesign?.type === "other" && (
                      <>
                        <label className="field-label" htmlFor="custom-breed">
                          Raza o tipo de perro
                        </label>
                        <Input
                          id="custom-breed"
                          value={customName}
                          maxLength={40}
                          placeholder="Ejemplo: Labrador"
                          onChange={(_, data) => onNameChange(data.value)}
                        />
                        <p className="silhouette-request-hint">
                          Incluiremos tu solicitud en el mensaje del pedido y te
                          contactaremos para definir la silueta; podrás enviar
                          una imagen de referencia por WhatsApp.
                        </p>
                      </>
                    )}
                    <span className="field-label">Color del papel</span>
                    <div
                      className="color-options"
                      ref={colorTargetRef}
                      role="radiogroup"
                      aria-label="Color del papel"
                    >
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          className={`color-swatch ${colorId === color.id ? "is-selected" : ""}`}
                          style={
                            {
                              "--swatch-color": color.value,
                            } as React.CSSProperties
                          }
                          onClick={() => {
                            onColorChange(color.id);
                            if (!editing && onboarding.step === "color") {
                              onboarding.setStep("save");
                            }
                          }}
                          aria-label={color.name}
                          aria-pressed={colorId === color.id}
                          title={color.name}
                        />
                      ))}
                      <span className="color-name">
                        {colors.find((color) => color.id === colorId)?.name}
                      </span>
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                  </section>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              {editing && (
                <Button
                  appearance="subtle"
                  icon={<DeleteRegular />}
                  onClick={onDelete}
                >
                  Eliminar banderín
                </Button>
              )}
              <Button appearance="secondary" onClick={onClose}>
                Cancelar
              </Button>
              {step > 0 && (
                <Button
                  appearance="secondary"
                  icon={<ArrowLeftRegular />}
                  type="button"
                  onClick={() => moveToStep(step - 1)}
                >
                  Atrás
                </Button>
              )}
              <Button
                appearance="primary"
                icon={step < 2 ? <ArrowRightRegular /> : undefined}
                type="submit"
                ref={step === 2 ? saveTargetRef : undefined}
              >
                {step < 2
                  ? "Continuar"
                  : editing
                    ? "Guardar cambios"
                    : "Agregar banderín"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
