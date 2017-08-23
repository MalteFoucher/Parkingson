import { MychatappPage } from './app.po';

describe('mychatapp App', () => {
  let page: MychatappPage;

  beforeEach(() => {
    page = new MychatappPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
