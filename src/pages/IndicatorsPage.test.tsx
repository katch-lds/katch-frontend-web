import { fireEvent, screen, within } from '@testing-library/react';
import { indicators, pendingCompany } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, indicatorService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { addDays } from '../validation/admin';
import { todayLocal } from '../validation/jobs';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { get } = indicatorService;
const today = todayLocal();
const defaultFrom = addDays(today, -29);
const display = (date: string) => date.split('-').reverse().join('/');
const location = () => screen.getByTestId('location').textContent;
const open = () => renderApp('/admin/indicadores', signedInStore('ADMIN'));
const barWidths = () =>
  screen.getAllByTestId('funnel-bar').map((bar) => (bar as HTMLElement).style.width);

function applyPeriod(from: string, to: string) {
  fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: from } });
  fireEvent.change(screen.getByLabelText('Data final'), { target: { value: to } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
}

beforeEach(() => resetServiceMocks());

describe('IndicatorsPage (A02)', () => {
  it('mostra o título, o subtítulo, o período por omissão e o estado de carregamento', () => {
    get.mockReturnValue(new Promise(() => undefined));
    open();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Painel de indicadores' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Valores agregados da plataforma para o período escolhido/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Data inicial')).toHaveValue(defaultFrom);
    expect(screen.getByLabelText('Data final')).toHaveValue(today);
    expect(screen.getByText('Período: 30 dias')).toBeInTheDocument();
    expect(screen.getByText('A carregar os indicadores…')).toBeInTheDocument();
  });

  it('mostra os sete valores da API com os rótulos, as notas e os títulos com as datas', async () => {
    open();

    expect(
      await screen.findByRole('heading', { name: `Estado na data final (${display(today)})` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: `Atividade no período (${display(defaultFrom)} a ${display(today)})`,
      }),
    ).toBeInTheDocument();
    const card = (label: string) => screen.getByText(label, { selector: 'p' }).parentElement!;
    expect(within(card('Candidatos com conta ativa')).getByText('24')).toBeInTheDocument();
    expect(within(card('Candidatos com conta ativa')).getByText('estado = ativa')).toBeVisible();
    expect(within(card('Empresas aprovadas')).getByText('5')).toBeInTheDocument();
    expect(within(card('Empresas pendentes')).getByText('2')).toBeInTheDocument();
    expect(within(card('Vagas publicadas pela 1.ª vez')).getByText('51')).toBeInTheDocument();
    expect(within(card('Interesses manifestados')).getByText('87')).toBeInTheDocument();
    expect(within(card('Matches confirmados')).getByText('12')).toBeInTheDocument();
    expect(within(card('Matches confirmados')).getByText('no período')).toBeVisible();
    expect(within(card('Conversas iniciadas')).getByText('9')).toBeInTheDocument();
    expect(screen.getByText('1.ª mensagem no período')).toBeVisible();
  });

  it('desenha as barras do interesse à conversa na proporção dos interesses', async () => {
    get.mockResolvedValue(
      indicators({ interestsExpressed: 80, matchesConfirmed: 20, conversationsStarted: 8 }),
    );
    open();

    await screen.findByText('Do interesse à conversa');

    expect(screen.getByText('Mesmos valores, em proporção dos interesses')).toBeVisible();
    expect(barWidths()).toEqual(['100%', '25%', '10%']);
  });

  it('com 0 interesses as barras ficam vazias, sem erro', async () => {
    get.mockResolvedValue(
      indicators({ interestsExpressed: 0, matchesConfirmed: 0, conversationsStarted: 0 }),
    );
    open();

    await screen.findByText('Do interesse à conversa');

    expect(barWidths()).toEqual(['0%', '0%', '0%']);
  });

  it('«Aplicar período» válido pede os indicadores do novo período e atualiza os títulos', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    applyPeriod('2026-10-01', '2026-10-31');

    expect(
      await screen.findByRole('heading', {
        name: 'Atividade no período (01/10/2026 a 31/10/2026)',
      }),
    ).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith('2026-10-01', '2026-10-31');
    expect(screen.getByText('Período: 31 dias')).toBeInTheDocument();
  });

  it('um só dia mostra «Período: 1 dia»', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    applyPeriod('2026-10-05', '2026-10-05');

    expect(await screen.findByText('Período: 1 dia')).toBeInTheDocument();
  });

  it('«Aplicar período» com o mesmo período repete o pedido', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));

    await screen.findByText('Do interesse à conversa');
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith(defaultFrom, today);
  });

  it('data inicial posterior à final (A02c): mensagem, campos a vermelho, sem pedido e sem cartões', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    applyPeriod('2026-10-31', '2026-10-01');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A data inicial tem de ser anterior ou igual à data final.',
    );
    expect(screen.getByLabelText('Data inicial')).toBeInvalid();
    expect(screen.getByLabelText('Data final')).toBeInvalid();
    expect(get).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Do interesse à conversa')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidatos com conta ativa')).not.toBeInTheDocument();
  });

  it('data final futura é rejeitada antes do pedido', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    applyPeriod('2026-10-01', addDays(today, 1));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A data final não pode ser posterior à data de hoje.',
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('datas em falta são rejeitadas antes do pedido', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    applyPeriod('', today);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Indique a data inicial e a data final.',
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('um período corrigido a seguir a um erro volta a mostrar os cartões', async () => {
    open();
    await screen.findByText('Do interesse à conversa');
    applyPeriod('2026-10-31', '2026-10-01');
    await screen.findByRole('alert');

    applyPeriod('2026-10-01', '2026-10-31');

    expect(await screen.findByText('Do interesse à conversa')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('um 400 ERR-10 do servidor aparece como erro do período, não como falha de ligação', async () => {
    get.mockRejectedValue(
      new ApiError(400, 'Os dados enviados não cumprem a validação automática.', 'ERR-10'),
    );
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Os dados enviados não cumprem a validação automática.',
    );
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument();
    expect(screen.queryByText('Do interesse à conversa')).not.toBeInTheDocument();
  });

  it('falha de ligação (A02d): alerta com «Tentar de novo», que repete o pedido', async () => {
    get.mockRejectedValueOnce(ApiError.connectionFailure());
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Do interesse à conversa')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('Offline → «Aplicar período» → Online → «Aplicar período» repete o pedido do mesmo período', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    get.mockRejectedValueOnce(ApiError.connectionFailure());
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
    expect(await screen.findByText('Do interesse à conversa')).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(3);

    get.mockRejectedValueOnce(ApiError.connectionFailure());
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar período' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Do interesse à conversa')).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(5);
    expect(get).toHaveBeenLastCalledWith(defaultFrom, today);
  });

  it('sem Empresas pendentes não mostra a faixa', async () => {
    open();
    await screen.findByText('Do interesse à conversa');

    expect(screen.queryByRole('button', { name: 'Ver pendentes' })).not.toBeInTheDocument();
    expect(screen.queryByText(/a aguardar aprovação/)).not.toBeInTheDocument();
  });

  it('com pendentes mostra a faixa com o número da lista e «Ver pendentes» vai para /admin/pendentes', async () => {
    adminCompanyService.listPending.mockResolvedValue([
      pendingCompany(),
      pendingCompany({ companyId: 'company-2' }),
      pendingCompany({ companyId: 'company-3' }),
    ]);
    open();

    expect(await screen.findByText('Há 3 Empresas a aguardar aprovação.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver pendentes' }));

    expect(location()).toBe('/admin/pendentes');
  });

  it('com uma pendente diz «1 Empresa»', async () => {
    adminCompanyService.listPending.mockResolvedValue([pendingCompany()]);
    open();

    expect(await screen.findByText('Há 1 Empresa a aguardar aprovação.')).toBeInTheDocument();
  });
});
