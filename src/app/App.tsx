import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
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
} from "@fluentui/react-components";
import { InfoRegular, QuestionCircleRegular } from "@fluentui/react-icons";
import { designs } from "../domain/designs/designs";
import {
  areGarlandSlotsComplete,
  getConfiguredCount,
} from "../domain/garland/rules";
import {
  buildGarlandShareUrl,
  serializeGarland,
} from "../domain/garland/share";
import {
  MAX_BANDERINES,
  type GarlandItem,
  type GarlandShape,
} from "../domain/garland/types";
import { useGarlandStore } from "../store/garlandStore";
import { downloadGarlandZip } from "../services/exportZip";
import { buildWhatsAppMessage, getWhatsAppUrl } from "../services/whatsapp";
import GarlandCarousel from "../components/garland/GarlandCarousel";
import GarlandOverview from "../components/garland/GarlandOverview";
import BanderinConfigurator from "../components/configurator/BanderinConfigurator";
import HelpDialog from "../components/help/HelpDialog";
import {
  useOnboarding,
  useOnboardingTarget,
} from "../components/onboarding/OnboardingProvider";

export default function App() {
  const { g, p } = useSearch({ from: "/" });
  const navigate = useNavigate();
  const items = useGarlandStore((state) => state.items);
  const orderNumber = useGarlandStore((state) => state.orderNumber);
  const addItem = useGarlandStore((state) => state.addItem);
  const updateItem = useGarlandStore((state) => state.updateItem);
  const duplicateItem = useGarlandStore((state) => state.duplicateItem);
  const removeItem = useGarlandStore((state) => state.removeItem);
  const resetGarland = useGarlandStore((state) => state.resetGarland);
  const setOrderNumber = useGarlandStore((state) => state.setOrderNumber);
  const onboarding = useOnboarding();

  const [shape, setShape] = useState<GarlandShape>("semi-circle");
  const [designId, setDesignId] = useState("schnauzer");
  const [colorId, setColorId] = useState("rosa");
  const [customName, setCustomName] = useState("");
  const [formError, setFormError] = useState("");
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const [scrollRequest, setScrollRequest] = useState<{ index: number; id: number } | null>(null);

  const introTargetRef = useOnboardingTarget("intro");
  const progressTargetRef = useOnboardingTarget("progress");
  const completionTargetRef = useOnboardingTarget("completion");
  const orderTargetRef = useOnboardingTarget("order");
  const whatsappTargetRef = useOnboardingTarget("whatsapp");

  const total = getConfiguredCount(items);
  const remaining = MAX_BANDERINES - total;
  const complete = areGarlandSlotsComplete(items);
  const editing = editingIndex !== undefined && Boolean(items[editingIndex]);
  const shareUrl = buildGarlandShareUrl(window.location.origin, items, orderNumber);

  useEffect(() => {
    const next = serializeGarland(items);
    if (next !== g)
      void navigate({
        to: "/",
        search: { g: next, p },
        replace: true,
        resetScroll: false,
      });
  }, [items, g, p, navigate]);

  useEffect(() => {
    // Solo los enlaces que traen número de pedido (?p=) permiten descargar el ZIP.
    if (!p) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      downloadGarlandZip(useGarlandStore.getState().items, p).catch(() => undefined);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [p]);

  useEffect(() => {
    if (
      complete &&
      ["duplicate", "carousel", "progress", "save"].includes(
        onboarding.step ?? "",
      )
    ) {
      onboarding.setStep("completion");
    }
  }, [complete, onboarding.step, onboarding.setStep]);

  const changeShape = (nextShape: GarlandShape) => {
    setShape(nextShape);
    const nextDesign = designs.find((design) =>
      design.supportedShapes.includes(nextShape),
    );
    if (
      !designs
        .find((design) => design.id === designId)
        ?.supportedShapes.includes(nextShape) &&
      nextDesign
    ) {
      setDesignId(nextDesign.id);
    }
  };

  const savedScroll = useRef<{ y: number; x: number } | null>(null);

  useEffect(() => {
    if (configuratorOpen || !savedScroll.current) return;
    const { y, x } = savedScroll.current;
    savedScroll.current = null;
    const restore = () => {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      const carousel = document.querySelector<HTMLElement>(".garland-carousel");
      if (carousel) carousel.scrollTo({ left: x, behavior: "instant" });
    };
    restore();
    const frame = requestAnimationFrame(restore);
    const timers = [50, 200, 400].map((delay) =>
      window.setTimeout(restore, delay),
    );
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
    };
  }, [configuratorOpen]);

  const openPosition = (index: number) => {
    savedScroll.current = {
      y: window.scrollY,
      x:
        document.querySelector<HTMLElement>(".garland-carousel")?.scrollLeft ??
        0,
    };
    const item = items[index];
    if (!item && onboarding.step === "add") onboarding.setStep("shape");
    setEditingIndex(index);
    setShape(item?.shape ?? "semi-circle");
    setDesignId(item?.designId ?? "schnauzer");
    setColorId(item?.colorId ?? "rosa");
    setCustomName(item?.customization?.name ?? "");
    setFormError("");
    setConfiguratorOpen(true);
  };

  const closeConfigurator = () => {
    if (["shape", "design", "color", "save"].includes(onboarding.step ?? "")) {
      onboarding.setStep("add");
    }
    setConfiguratorOpen(false);
    setEditingIndex(undefined);
    setFormError("");
  };

  const handleSaveItem = (item: Omit<GarlandItem, "id">) => {
    if (editingIndex === undefined) return;
    const adding = !editing;
    const error = editing
      ? updateItem(editingIndex, item)
      : addItem(editingIndex, item);
    setFormError(error ?? "");
    if (!error) {
      if (
        adding &&
        ["shape", "design", "color", "save"].includes(onboarding.step ?? "")
      ) {
        onboarding.setStep("duplicate");
      }
      setCustomName("");
      setConfiguratorOpen(false);
      setEditingIndex(undefined);
    }
  };

  const handleDeleteItem = () => {
    if (editingIndex !== undefined) removeItem(editingIndex);
    closeConfigurator();
  };

  const handleWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderNumber.trim()) {
      setOrderError("Ingresa tu número de pedido.");
      return;
    }
    const message = buildWhatsAppMessage(orderNumber, items, shareUrl);
    window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    onboarding.complete();
    resetGarland();
    setOrderDialogOpen(false);
    setOrderError("");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Petu, inicio">
          petu<span>✳</span>
        </a>
        <span className="topbar-note">PAPEL PICADO HECHO CON CARIÑO</span>
        <Button
          appearance="subtle"
          icon={<QuestionCircleRegular />}
          aria-label="Abrir ayuda"
          title="Ayuda"
          onClick={() => {
            if (onboarding.step === "intro") onboarding.setStep("add");
            else if (onboarding.step) onboarding.dismiss();
            setHelpOpen(true);
          }}
        />
      </header>

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow">UN FESTEJO MUY TUYO</p>
          <h1>
            Diseña tu
            <br />
            <em>guirnalda</em>
          </h1>
        </div>
        <p className="intro-copy">
          Elige tus banderines favoritos y arma una guirnalda que hable de
          ustedes.
        </p>
      </section>

      <section
        className="garland-builder"
        aria-label="Guirnalda de 10 banderines"
        ref={introTargetRef}
      >
        <div className="preview-heading">
          <div>
            <p className="eyebrow">ASÍ VA QUEDANDO</p>
            <h2>Tu guirnalda</h2>
          </div>
          <Badge
            ref={progressTargetRef}
            appearance={complete ? "filled" : "outline"}
            color={complete ? "success" : "informative"}
          >
            {total} / {MAX_BANDERINES}
          </Badge>
        </div>
        <GarlandOverview
          items={items}
          onSelectPosition={(index) =>
            setScrollRequest((current) => ({ index, id: (current?.id ?? 0) + 1 }))
          }
        />
        <p className="carousel-swipe-hint">
          Desliza las tarjetas hacia la izquierda o la derecha para recorrer tus
          10 banderines.
        </p>
        <GarlandCarousel
          scrollRequest={scrollRequest}
          items={items}
          onSelectPosition={openPosition}
          onDuplicatePosition={duplicateItem}
        />
        <div className="garland-progress">
          <div
            className="progress-track"
            aria-label={`${total} de ${MAX_BANDERINES} posiciones configuradas`}
          >
            <span style={{ width: `${total * 10}%` }} />
          </div>
          <p className="progress-copy">
            {complete
              ? "¡Tu guirnalda está completa!"
              : `Completa los ${remaining} banderines restantes para continuar.`}
          </p>
        </div>
        <Button
          appearance="primary"
          size="large"
          className="continue-button"
          ref={completionTargetRef}
          onClick={() => {
            if (onboarding.step === "completion") onboarding.setStep("order");
            setOrderDialogOpen(true);
          }}
          disabled={!complete}
        >
          Continuar <span aria-hidden="true">↗</span>
        </Button>
      </section>

      <footer className="footer-note">
        HECHO A MANO, HECHO PARA CELEBRAR <span>✳</span>
      </footer>

      {configuratorOpen && (
        <BanderinConfigurator
          open={configuratorOpen}
          position={(editingIndex ?? 0) + 1}
          editing={editing}
          shape={shape}
          designId={designId}
          colorId={colorId}
          customName={customName}
          error={formError}
          onShapeChange={changeShape}
          onDesignChange={(value) => {
            setDesignId(value);
            setFormError("");
          }}
          onColorChange={setColorId}
          onNameChange={setCustomName}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          onClose={closeConfigurator}
        />
      )}

      <Dialog
        open={orderDialogOpen}
        onOpenChange={(_, data) => {
          setOrderDialogOpen(data.open);
          setOrderError("");
        }}
      >
        <DialogSurface>
          <form onSubmit={handleWhatsApp}>
            <DialogBody>
              <DialogTitle>Número de pedido</DialogTitle>
              <DialogContent>
                <div className="order-field" ref={orderTargetRef}>
                  <div className="order-label-row">
                    <label htmlFor="order-number">
                      Escribe el número asociado a tu compra.
                    </label>
                    <Popover positioning={{ position: "above", align: "end" }}>
                      <PopoverTrigger disableButtonEnhancement>
                        <Button
                          appearance="subtle"
                          icon={<InfoRegular />}
                          aria-label="¿Dónde encuentro mi número de pedido?"
                        />
                      </PopoverTrigger>
                      <PopoverSurface className="order-info">
                        Tu número de pedido fue enviado al correo electrónico
                        que utilizaste para realizar tu compra en LolaPay. Si no
                        lo encuentras, revisa también tu carpeta de spam o
                        correo no deseado.
                      </PopoverSurface>
                    </Popover>
                  </div>
                  <Input
                    id="order-number"
                    autoFocus
                    value={orderNumber}
                    placeholder="Número de pedido"
                    onChange={(_, data) => {
                      setOrderNumber(data.value);
                      setOrderError("");
                      if (
                        ["order", "whatsapp"].includes(onboarding.step ?? "")
                      ) {
                        onboarding.setStep(
                          data.value.trim() ? "whatsapp" : "order",
                        );
                      }
                    }}
                  />
                </div>
                {orderError && (
                  <p className="form-error" role="alert">
                    {orderError}
                  </p>
                )}
                <section className="order-summary">
                  <h3>Resumen de tu guirnalda</h3>
                  <pre>
                    {buildWhatsAppMessage(orderNumber || "—", items, shareUrl)}
                  </pre>
                </section>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  ref={whatsappTargetRef}
                >
                  Abrir WhatsApp
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onReplayTutorial={() => {
          setHelpOpen(false);
          onboarding.restart();
        }}
      />
    </main>
  );
}
