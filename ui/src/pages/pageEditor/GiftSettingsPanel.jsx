/**
 * Dijital takı alanları — aç/kapa üstteki bileşen toggle panelinden yönetilir.
 *
 * @param {{
 *   giftBankName: string,
 *   setGiftBankName: (v: string) => void,
 *   giftRecipientName: string,
 *   setGiftRecipientName: (v: string) => void,
 *   giftIban: string,
 *   setGiftIban: (v: string) => void,
 * }} props
 */
export function GiftSettingsPanel({
  giftBankName,
  setGiftBankName,
  giftRecipientName,
  setGiftRecipientName,
  giftIban,
  setGiftIban,
}) {
  return (
    <div className="gift-settings-panel gift-settings-panel--fields-only">
      <p className="form-hint" style={{ marginTop: 0 }}>
        Misafirlerin IBAN üzerinden takı/hediye gönderebilmesi için bilgileri girin.
      </p>
      <div className="gift-settings-fields">
        <label htmlFor="page-field-gift-bank" className="visually-hidden">
          Banka adı
        </label>
        <input
          id="page-field-gift-bank"
          name="giftBankName"
          value={giftBankName}
          onChange={(e) => setGiftBankName(e.target.value)}
          placeholder="Banka Adı (Örn: Ziraat Bankası)"
          autoComplete="organization"
        />
        <label htmlFor="page-field-gift-recipient" className="visually-hidden">
          Alıcı adı soyadı
        </label>
        <input
          id="page-field-gift-recipient"
          name="giftRecipientName"
          value={giftRecipientName}
          onChange={(e) => setGiftRecipientName(e.target.value)}
          placeholder="Alıcı Adı Soyadı"
          autoComplete="name"
        />
        <label htmlFor="page-field-gift-iban" className="visually-hidden">
          IBAN numarası
        </label>
        <input
          id="page-field-gift-iban"
          name="giftIban"
          value={giftIban}
          onChange={(e) => setGiftIban(e.target.value.toUpperCase())}
          placeholder="IBAN Numarası (TR00...)"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
