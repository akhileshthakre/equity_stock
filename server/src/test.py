import math

constantTS = None  # change this with W1 from sheet as user input
constantSloss = None  # Change with the actual M2 from the sheet as user input
constantTGT = None  # change it with the N2 of the sheet as user input


def round_to_decimal_places(number):
    factor = 10 ** 2
    return round(number * factor) / factor


def calculate_h_ref_points(stock, prev_stock, index, test_value):
    fall_in_stock = test_value['fallInStock']
    high = stock['high']

    if index == 0:
        return high
    elif index == 1:
        return round_to_decimal_places(prev_stock['HrefPoint'] * (1 + (fall_in_stock / 100)))
    elif index == 2:
        return high

    open_price = prev_stock['open']
    trade_close = prev_stock.get('TradeClose', None)
    prev_href_point = prev_stock.get('HrefPoint', None)
    prev_high = prev_stock['high']

    if open_price == "":
        return ""

    if trade_close == 1:
        return round_to_decimal_places(prev_stock['SP'])
    elif prev_href_point > prev_high:
        return round_to_decimal_places(prev_href_point)
    else:
        return round_to_decimal_places(prev_high)


def calculate_decline_from_rp(stock, prev_stock, index, test_value):
    if index == 0:
        return None
    if index == 1 or index == 2:
        return stock['low'] / prev_stock['HrefPoint'] - 1

    low = stock['low']
    prev_href_point = prev_stock.get('HrefPoint', None)

    if low == "":
        return ""
    else:
        decline_in_rp = low / prev_href_point - 1
        return decline_in_rp


def calculate_bp(stock, prev_stock, index, test_value):
    fall_in_stock = test_value['fallInStock']
    limit_level = test_value['limitLevel']

    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    prev_carry = prev_stock.get('Carry', None)
    prev_bp = prev_stock.get('BP', None)
    low = stock['low']
    href_point = stock.get('HrefPoint', calculate_h_ref_points(stock, prev_stock, index, test_value))
    constant_b1 = fall_in_stock / 100
    constant_d1 = limit_level / 100

    if open_price == "":
        return ""
    if prev_carry == 1:
        return prev_bp
    if low < href_point * (1 + constant_b1 - constant_d1):
        return round_to_decimal_places(href_point * (1 + constant_b1 - constant_d1))
    else:
        return ""


def calculate_pos_initial(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    bp = stock.get('BP', calculate_bp(stock, prev_stock, index, test_value))
    prev_bp = prev_stock.get('BP', None)

    if bp == "":
        return ""
    else:
        return 1 if bp != prev_bp else ""


def calculate_tgt(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)
    bp = stock.get('BP', calculate_bp(stock, prev_stock, index, test_value))
    constant_n2 = constantTGT

    if open_price == "":
        return ""
    else:
        if pos_initial == 1 or prev_carry == 1:
            return round_to_decimal_places(bp * (1 + constant_n2))
        else:
            return ""


def calculate_sl_hit(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)
    low = stock['low']
    sloss = stock.get('Sloss', calculate_sloss(stock, prev_stock, index, test_value))

    if open_price == "":
        return ""
    else:
        if (pos_initial == 1 or prev_carry == 1) and low <= sloss:
            return 1
        else:
            return 0


def calculate_tgt_hit(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    sl_hit = stock.get('SLHit', calculate_sl_hit(stock, prev_stock, index, test_value))
    high = stock['high']
    tgt = stock.get('TGT', calculate_tgt(stock, prev_stock, index, test_value))
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)

    if open_price == "":
        return ""
    else:
        if sl_hit == 0 and high >= tgt and (pos_initial == 1 or prev_carry == 1):
            return 1
        else:
            return 0


def calculate_hld_day(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)
    prev_hld_days = prev_stock.get('HLDDay', None)

    if open_price == "":
        return ""
    else:
        if pos_initial == 1:
            return 0
        elif prev_carry == 1:
            return prev_hld_days + 1
        else:
            return ""


def calculate_trade_close(stock, prev_stock, index, test_value):
    holding_day = int(test_value['hldDay'])
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)
    sl_hit = stock.get('SLHit', calculate_sl_hit(stock, prev_stock, index, test_value))
    tgt_hit = stock.get('TGTHit', calculate_tgt_hit(stock, prev_stock, index, test_value))
    hld_day = stock.get('HLDDay', calculate_hld_day(stock, prev_stock, index, test_value))
    constant_f1 = holding_day

    if open_price == "":
        return ""
    else:
        if (pos_initial == 1 or prev_carry == 1) and (sl_hit == 1 or tgt_hit == 1 or hld_day == constant_f1):
            return 1
        else:
            return 0


def calculate_sloss(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    prev_carry = prev_stock.get('Carry', None)
    bp = stock.get('BP', calculate_bp(stock, prev_stock, index, test_value))
    constant_m2 = constantSloss

    if open_price == "":
        return ""
    else:
        if pos_initial == 1 or prev_carry == 1:
            return round_to_decimal_places(bp * (1 - constant_m2))
        else:
            return ""


def calculate_sp(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    trade_close = stock.get('TradeClose', calculate_trade_close(stock, prev_stock, index, test_value))
    sl_hit = stock.get('SLHit', calculate_sl_hit(stock, prev_stock, index, test_value))
    tgt_hit = stock.get('TGTHit', calculate_tgt_hit(stock, prev_stock, index, test_value))
    sloss = stock.get('Sloss', calculate_sloss(stock, prev_stock, index, test_value))
    tgt = stock.get('TGT', calculate_tgt(stock, prev_stock, index, test_value))
    price = stock['price']
    constant_w1 = constantTS

    if open_price == "":
        return ""
    else:
        if trade_close == 1:
            if sl_hit == 1:
                return round_to_decimal_places(sloss * (1 - constant_w1))
            elif tgt_hit == 1:
                return round_to_decimal_places(tgt * (1 - constant_w1))
            elif trade_close == 1:
                return round_to_decimal_places(price * (1 - constant_w1))
            else:
                return ""
        else:
            return ""


def calculate_carry(stock, prev_stock, index, sp_value, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    open_price = stock['open']
    prev_carry = prev_stock.get('Carry', None)
    pos_initial = stock.get('DPosInitial', calculate_pos_initial(stock, prev_stock, index, test_value))
    sp = sp_value

    if open_price == "":
        return ""
    elif prev_carry or pos_initial:
        if (prev_carry == 1 or pos_initial == 1) and sp == "":
            return 1
        else:
            return 0


def calculate_ret(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    sp = stock.get('SP', calculate_sp(stock, prev_stock, index, test_value))
    bp = stock.get('BP', calculate_bp(stock, prev_stock, index, test_value))

    if sp == "" or sp is None:
        return None

    ret = (sp / bp - 1) * 100
    rounded_off = round(ret, 1)
    return rounded_off


def calculate_nd(stock, prev_stock, index, test_value):
    if index == 0 or index == 1 or index == 2:
        return None

    trade_close = stock.get('TradeClose', calculate_trade_close(stock, prev_stock, index, test_value))
    sp = stock.get('SP', calculate_sp(stock, prev_stock, index, test_value))
    href_point = stock.get('HrefPoint', calculate_href_points(stock, prev_stock, index, test_value))
    high = stock['high']

    if trade_close == 1:
        return sp
    else:
        if href_point > high:
            return href_point
        else:
            return high

def calculate_LP(stock, prev_stock, index, test_value, nd, carry):
    if index == 0 or index == 1 or index == 2:
        return None

    fall_in_stock = test_value["fallInStock"] / 100
    limit_level = test_value["limitLevel"] / 100

    if carry == 0:
        return nd * (1 + fall_in_stock - limit_level)
    else:
        return "X"


def round_to_decimal_places(number):
    factor = 10 ** 2
    return round(number * factor) / factor


def calculate_values(stocks, test_cases, sloss_percent, tg_percent, ts_percent):
    constant_tgt = tg_percent / 100 if tg_percent else 25 / 100
    constant_sloss = sloss_percent / 100 if sloss_percent else 10 / 100
    constant_ts = ts_percent / 100 if ts_percent else 0.08 / 100

    fall_in_stock = test_cases["fallInStock"] * 100
    limit_level = test_cases["limitLevel"] * 100
    hld_day = int(test_cases["hldDay"])
    test_value = {
        "fallInStock": fall_in_stock,
        "limitLevel": limit_level,
        "hldDay": hld_day
    }
    prev_stock = None
    calculated_stocks = []
    
    for index, stock_data in enumerate(stocks):
        stock = stock_data["dataValues"]
        href_point = calculate_HRefPoints(stock, prev_stock, index, test_value)
        decline_in_rp = calculate_DeclineFromRP(stock, prev_stock, index, test_value)
        bp = calculate_BP(stock, prev_stock, index, test_value)
        pos_initial = calculate_PosInitial(stock, prev_stock, index, test_value)
        tgt = calculate_TGT(stock, prev_stock, index, test_value)
        sl_hit = calculate_SLHit(stock, prev_stock, index, test_value)
        tgt_hit = calculate_TGTHit(stock, prev_stock, index, test_value)
        hld_day = calculate_HLDDay(stock, prev_stock, index, test_value)
        trade_close = calculate_TradeClose(stock, prev_stock, index, test_value)
        sp = calculate_SP(stock, prev_stock, index, test_value)
        carry = calculate_Carry(stock, prev_stock, index, sp, test_value)
        sloss = calculate_Sloss(stock, prev_stock, index, test_value)
        ret = calculate_Ret(stock, prev_stock, index, test_value)
        nd = calculate_ND(stock, prev_stock, index, test_value)
        lp = calculate_LP(stock, prev_stock, index, test_value, nd, carry)

        prev_stock = {
            **stock,
            "HrefPoint": href_point,
            "declineInRP": decline_in_rp,
            "BP": bp,
            "DPosInitial": pos_initial,
            "TGT": tgt,
            "SLHit": sl_hit,
            "TGTHit": tgt_hit,
            "HLDDay": hld_day,
            "TradeClose": trade_close,
            "SP": sp,
            "Carry": carry,
            "Sloss": sloss,
            "Ret": ret,
            "ND": nd,
            "LP": lp,
        }

        calculated_stocks.append({
            **stock,
            "HrefPoint": href_point,
            "declineInRP": decline_in_rp,
            "BP": bp,
            "DPosInitial": pos_initial,
            "TGT": tgt,
            "SLHit": sl_hit,
            "TGTHit": tgt_hit,
            "HLDDay": hld_day,
            "TradeClose": trade_close,
            "SP": sp,
            "Carry": carry,
            "Sloss": sloss,
            "Ret": ret,
            "ND": nd,
            "LP": lp,
        })

    return calculated_stocks


       
