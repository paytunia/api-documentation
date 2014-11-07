import time
import quickfix as fix
import quickfix44 as fixMsg

USERNAME = 'PYTHON_TESTS'
SENDERCOMPID = 'TEST_CLIENT'
FIX44FILE = './FIX44.xml'
DEBUG = False


class MyApplication(fix.Application):

    def onCreate(self, sessionID):
        pass

    def onLogon(self, sessionID):
        pass

    def onLogout(self, sessionID):
        pass

    def toAdmin(self, message, sessionID):
        msg_type = message.getHeader().getField(fix.MsgType()).getString()
        if msg_type == fix.MsgType_Logon:
            message.setField(fix.Username(USERNAME))
            message.setField(fix.ResetSeqNumFlag(True))

    def toApp(self, message, sessionID):
        pass

    def fromAdmin(self, message, sessionID):
        passr

    def fromApp(self, message, sessionID):
        msg_type = message.getHeader().getField(fix.MsgType()).getString()
        depth = {}
        if msg_type == fix.MsgType_MarketDataSnapshotFullRefresh:
            group = fixMsg.MarketDataSnapshotFullRefresh.NoMDEntries()
            nb_entries = int(message.getField(fix.NoMDEntries()).getString())
            for i in range(1, nb_entries + 1):
                message.getGroup(i, group)
                md_type = group.getField(fix.MDEntryType()).getString()
                md_price = group.getField(fix.MDEntryPx()).getString()
                md_amount = group.getField(fix.MDEntrySize()).getString()
                if not md_amount:
                    md_amount = 0
                order = {'price': float(md_price), 'amount': float(md_amount)}
                if md_type == fix.MDEntryType_OFFER:
                    if 'asks' not in depth:
                        depth['asks'] = []
                    depth['asks'].append(order)
                if md_type == fix.MDEntryType_BID:
                    if 'bids' not in depth:
                        depth['bids'] = []
                    depth['bids'].append(order)
            print("Received a full market data snapshot: %s" % (depth))
        elif msg_type == fix.MsgType_MarketDataIncrementalRefresh:
            group = fixMsg.MarketDataIncrementalRefresh.NoMDEntries()
            nb_entries = int(message.getField(fix.NoMDEntries()).getString())
            for i in range(1, nb_entries + 1):
                message.getGroup(i, group)
                md_type = group.getField(fix.MDEntryType()).getString()
                md_price = group.getField(fix.MDEntryPx()).getString()
                md_amount = group.getField(fix.MDEntrySize()).getString()
                if not md_amount:
                    md_amount = 0
                order = {'price': float(md_price), 'amount': float(md_amount)}
                if md_type == fix.MDEntryType_OFFER:
                    if 'asks' not in depth:
                        depth['asks'] = []
                    depth['asks'].append(order)
                if md_type == fix.MDEntryType_BID:
                    if 'bids' not in depth:
                        depth['bids'] = []
                    depth['bids'].append(order)
            print("Received an incremental market data update: %s" % (depth))

def main():
    sessionID = fix.SessionID('FIX.4.4', SENDERCOMPID, 'PAYMIUM')

    params = fix.Dictionary()
    params.setString('ConnectionType', 'initiator')
    params.setString('StartTime', '00:00:00')
    params.setString('EndTime', '00:00:00')
    params.setString('HeartBtInt', '30')
    params.setString('CheckLatency', 'Y')
    params.setString('SocketConnectHost', '195.154.171.115')
    params.setString('SocketConnectPort', '8359')
    params.setString('DataDictionary', FIX44FILE)
    params.setString('EncryptMethod', '0')

    settings = fix.SessionSettings()
    settings.set(sessionID, params)

    application = MyApplication()
    factory = fix.FileStoreFactory("store")
    acceptor = fix.SocketInitiator(application, factory, settings, fix.ScreenLogFactory(DEBUG, DEBUG, DEBUG))
    acceptor.start()

    time.sleep(2)

    mdr = fixMsg.MarketDataRequest()
    mdr.setField(fix.MDReqID("MDRQ-%d" % (time.time() * 1000000)))
    # We want the full book here, not just the top
    mdr.setField(fix.MarketDepth(1))
    # We want to get a snapshot and also subscribe to the market depth updates
    mdr.setField(fix.SubscriptionRequestType(
        fix.SubscriptionRequestType_SNAPSHOT_PLUS_UPDATES))
    # We'll want only incremental refreshes when new data is available
    mdr.setField(fix.MDUpdateType(fix.MDUpdateType_INCREMENTAL_REFRESH))
    # Specify the currency
    instruments = fixMsg.MarketDataRequest().NoRelatedSym()
    instruments.setField(fix.Symbol("EUR/XBT"))
    mdr.addGroup(instruments)
    # Specify that we'll want the bids and asks
    mdr.setField(fix.NoMDEntryTypes(2))
    group = fixMsg.MarketDataRequest().NoMDEntryTypes()
    group.setField(fix.MDEntryType(fix.MDEntryType_BID))
    group.setField(fix.MDEntryType(fix.MDEntryType_OFFER))
    mdr.addGroup(group)

    fix.Session.sendToTarget(mdr, sessionID)

    while True:
        time.sleep(10)
        msg = fixMsg.Heartbeat()
        fix.Session.sendToTarget(msg, sessionID)

    acceptor.stop()

if __name__ == '__main__':

    main()
