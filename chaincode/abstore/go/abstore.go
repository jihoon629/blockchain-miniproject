package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ABstore Chaincode implementation
type ABstore struct {
	contractapi.Contract
}

var Admin = "Admin"

// 🔥 상품(Item) 구조체 (상품 등록용)
type Item struct {
	ID     string `json:"id"`       // 상품 고유 ID
	Name   string `json:"name"`     // 상품 이름
	Price  int    `json:"price"`    // 상품 가격
	Seller string `json:"seller"`   // 판매자
	Status string `json:"status"`   // 상품 상태 (available, sold)
}

// 🔥 에스크로(Escrow) 구조체 (거래 체결용)
type Escrow struct {
	Buyer           string  `json:"buyer"`           // 구매자 ID
	Seller          string  `json:"seller"`          // 판매자 ID
	BuyerAmount     float64 `json:"buyerAmount"`     // 구매자가 입력한 금액
	SellerAmount    float64 `json:"sellerAmount"`    // 판매자가 입력한 금액
	BuyerConfirmed  bool    `json:"buyerConfirmed"`  // 구매자 확인 여부
	SellerConfirmed bool    `json:"sellerConfirmed"` // 판매자 확인 여부
	Completed       bool    `json:"completed"`       // 거래 완료 여부
}

func (t *ABstore) WithdrawMoney(ctx contractapi.TransactionContextInterface, id string, amountStr string) error {
	fmt.Printf("WithdrawMoney called for ID: %s, Amount: %s\n", id, amountStr)

	// 1. 출금액 문자열을 정수로 변환
	amount, err := strconv.Atoi(amountStr)
	if err != nil {
		return fmt.Errorf("invalid amount format '%s': %v", amountStr, err)
	}

	// 2. 출금액이 양수인지 확인
	if amount <= 0 {
		return fmt.Errorf("withdrawal amount must be a positive value, received %d", amount)
	}

	// 3. 원장에서 현재 지갑(ID)의 잔액 조회
	balanceBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read wallet %s from world state: %v", id, err)
	}
	if balanceBytes == nil {
		return fmt.Errorf("the wallet %s does not exist", id)
	}

	// 4. 현재 잔액 바이트를 정수로 변환
	currentBalance, _ := strconv.Atoi(string(balanceBytes))

	// 5. 잔액이 출금액보다 충분한지 확인
	if currentBalance < amount {
		return fmt.Errorf("insufficient funds for withdrawal: wallet %s has %d, tried to withdraw %d", id, currentBalance, amount)
	}

	// 6. 새로운 잔액 계산 (현재 잔액 - 출금액)
	newBalance := currentBalance - amount
	fmt.Printf("Updating balance for %s: %d - %d = %d\n", id, currentBalance, amount, newBalance)

	// 7. 계산된 새로운 잔액을 문자열로 변환하여 원장에 저장
	err = ctx.GetStub().PutState(id, []byte(strconv.Itoa(newBalance)))
	if err != nil {
		return fmt.Errorf("failed to update wallet %s balance after withdrawal: %v", id, err)
	}

	fmt.Printf("Wallet %s balance updated successfully to %d after withdrawal\n", id, newBalance)
	return nil // 성공 시 nil 반환
}

func (t *ABstore) DepositMoney(ctx contractapi.TransactionContextInterface, id string, amountStr string) error {
	fmt.Printf("DepositMoney called for ID: %s, Amount: %s\n", id, amountStr)

	// 1. 입금액 문자열을 정수로 변환
	amount, err := strconv.Atoi(amountStr)
	if err != nil {
		// 변환 실패 시 오류 반환 (잘못된 숫자 형식)
		return fmt.Errorf("invalid amount format '%s': %v", amountStr, err)
	}

	// 2. 입금액이 양수인지 확인
	if amount <= 0 {
		return fmt.Errorf("deposit amount must be a positive value, received %d", amount)
	}

	// 3. 원장에서 현재 지갑(ID)의 잔액 조회
	balanceBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		// 원장 조회 중 오류 발생 시
		return fmt.Errorf("failed to read wallet %s from world state: %v", id, err)
	}
	if balanceBytes == nil {
		// 해당 ID의 지갑이 존재하지 않는 경우
		return fmt.Errorf("the wallet %s does not exist", id)
	}

	// 4. 현재 잔액 바이트를 정수로 변환
	currentBalance, _ := strconv.Atoi(string(balanceBytes)) // GetState가 성공했으므로 변환 오류는 거의 없음

	// 5. 새로운 잔액 계산 (현재 잔액 + 입금액)
	newBalance := currentBalance + amount
	fmt.Printf("Updating balance for %s: %d + %d = %d\n", id, currentBalance, amount, newBalance)

	// 6. 계산된 새로운 잔액을 문자열로 변환하여 원장에 저장 (덮어쓰기)
	err = ctx.GetStub().PutState(id, []byte(strconv.Itoa(newBalance)))
	if err != nil {
		// 원장 저장 중 오류 발생 시
		return fmt.Errorf("failed to update wallet %s balance: %v", id, err)
	}

	fmt.Printf("Wallet %s balance updated successfully to %d\n", id, newBalance)
	return nil // 성공 시 nil 반환
}


func (t *ABstore) Init(ctx contractapi.TransactionContextInterface, A string, Aval int) error {
	fmt.Println("ABstore Init")
	var err error
	// Initialize the chaincode
	fmt.Printf("Aval = %d \n", Aval)
	// Write the state to the ledger
	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return err
	}


	return nil
} 

// ✅ 체인코드 Init
// func (t *ABstore) Init(ctx contractapi.TransactionContextInterface, A string, Aval int, B string, Bval int) error {
// 	fmt.Println("ABstore Init")
// 	var err error

// 	fmt.Printf("Aval = %d, Bval = %d\n", Aval, Bval)

// 	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
// 	if err != nil {
// 		return err
// 	}

// 	err = ctx.GetStub().PutState(B, []byte(strconv.Itoa(Bval)))
// 	if err != nil {
// 		return err
// 	}

// 	err = ctx.GetStub().PutState(Admin, []byte("0"))
// 	if err != nil {
// 		return err
// 	}

// 	return nil
// }

// ✅ 상품 등록
func (t *ABstore) CreateItem(ctx contractapi.TransactionContextInterface, id string, name string, price int, seller string) error {
	exists, err := t.ItemExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Item %s already exists", id)
	}

	item := Item{
		ID:     id,
		Name:   name,
		Price:  price,
		Seller: seller,
		Status: "available",
	}

	itemJSON, err := json.Marshal(item)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, itemJSON)
}

// ✅ 상품 존재 여부 체크
func (t *ABstore) ItemExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	itemJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, err
	}
	return itemJSON != nil, nil
}

// ✅ 구매자 거래 확인
func (t *ABstore) BuyerConfirm(ctx contractapi.TransactionContextInterface, escrowID string, amount float64) error {
	escrow, err := t.ReadEscrow(ctx, escrowID)
	if err != nil {
		escrow = Escrow{}
	}
	clientID, _ := ctx.GetClientIdentity().GetID()

	escrow.Buyer = clientID
	escrow.BuyerAmount = amount
	escrow.BuyerConfirmed = true

	return t.updateEscrow(ctx, escrowID, &escrow)
}

// ✅ 판매자 거래 확인
func (t *ABstore) SellerConfirm(ctx contractapi.TransactionContextInterface, escrowID string, amount float64) error {
	escrow, err := t.ReadEscrow(ctx, escrowID)
	if err != nil {
		return fmt.Errorf("Escrow does not exist. Buyer must confirm first.")
	}
	clientID, _ := ctx.GetClientIdentity().GetID()

	escrow.Seller = clientID
	escrow.SellerAmount = amount
	escrow.SellerConfirmed = true

	return t.updateEscrow(ctx, escrowID, &escrow)
}

// ✅ 거래 최종 완료
func (t *ABstore) Finalize(ctx contractapi.TransactionContextInterface, escrowID string) error {
	escrow, err := t.ReadEscrow(ctx, escrowID)
	if err != nil {
		return err
	}

	if !escrow.BuyerConfirmed || !escrow.SellerConfirmed {
		return fmt.Errorf("both buyer and seller must confirm first")
	}

	if escrow.BuyerAmount != escrow.SellerAmount {
		return fmt.Errorf("amount mismatch: buyer %f vs seller %f", escrow.BuyerAmount, escrow.SellerAmount)
	}

	if escrow.Completed {
		return fmt.Errorf("already finalized")
	}

	escrow.Completed = true
	return t.updateEscrow(ctx, escrowID, &escrow)
}

// ✅ 에스크로 데이터 읽기
func (t *ABstore) ReadEscrow(ctx contractapi.TransactionContextInterface, escrowID string) (Escrow, error) {
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return Escrow{}, err
	}
	if escrowJSON == nil {
		return Escrow{}, fmt.Errorf("Escrow %s does not exist", escrowID)
	}

	var escrow Escrow
	err = json.Unmarshal(escrowJSON, &escrow)
	if err != nil {
		return Escrow{}, err
	}

	return escrow, nil
}

// ✅ 에스크로 데이터 업데이트
func (t *ABstore) updateEscrow(ctx contractapi.TransactionContextInterface, escrowID string, escrow *Escrow) error {
	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}

// ✅ 기존 송금 기능 (변경 없음)
func (t *ABstore) Invoke(ctx contractapi.TransactionContextInterface, A, B string, X int) error {
	var err error
	var Aval int
	var Bval int
	var Adminval int

	Avalbytes, err := ctx.GetStub().GetState(A)
	if err != nil {
		return fmt.Errorf("Failed to get state")
	}
	if Avalbytes == nil {
		return fmt.Errorf("Entity not found")
	}
	Aval, _ = strconv.Atoi(string(Avalbytes))

	Bvalbytes, err := ctx.GetStub().GetState(B)
	if err != nil {
		return fmt.Errorf("Failed to get state")
	}
	if Bvalbytes == nil {
		return fmt.Errorf("Entity not found")
	}
	Bval, _ = strconv.Atoi(string(Bvalbytes))

	Adminvalbytes, err := ctx.GetStub().GetState(Admin)
	if err != nil {
		return fmt.Errorf("Failed to get state")
	}
	if Adminvalbytes == nil {
		return fmt.Errorf("Entity not found")
	}
	Adminval, _ = strconv.Atoi(string(Adminvalbytes))

	Aval = Aval - X
	Bval = Bval + (X - X/10)
	Adminval = Adminval + (X / 10)
	fmt.Printf("Aval = %d, Bval = %d Adminval = %d\n", Aval, Bval, Adminval)

	err = ctx.GetStub().PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(Admin, []byte(strconv.Itoa(Adminval)))
	if err != nil {
		return err
	}

	return nil
}

// ✅ 상품 하나 조회 (QueryItem)
func (t *ABstore) QueryItem(ctx contractapi.TransactionContextInterface, id string) (*Item, error) {
	itemJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if itemJSON == nil {
		return nil, fmt.Errorf("the item %s does not exist", id)
	}

	var item Item
	err = json.Unmarshal(itemJSON, &item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// ✅ 전체 상품 조회 (QueryAllItems)
func (t *ABstore) QueryAllItems(ctx contractapi.TransactionContextInterface) ([]*Item, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var items []*Item
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var item Item
		err = json.Unmarshal(queryResponse.Value, &item)
		if err != nil {
			continue // 다른 데이터는 무시하고 Item만 추가
		}

		if item.ID != "" && item.Name != "" {
			items = append(items, &item)
		}
	}
	return items, nil
}

// ✅ 에스크로 데이터 조회 (QueryEscrow)
func (t *ABstore) QueryEscrow(ctx contractapi.TransactionContextInterface, escrowID string) (*Escrow, error) {
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return nil, fmt.Errorf("failed to read escrow from world state: %v", err)
	}
	if escrowJSON == nil {
		return nil, fmt.Errorf("the escrow %s does not exist", escrowID)
	}

	var escrow Escrow
	err = json.Unmarshal(escrowJSON, &escrow)
	if err != nil {
		return nil, err
	}

	return &escrow, nil
}


// ✅ 삭제 기능 (변경 없음)
func (t *ABstore) Delete(ctx contractapi.TransactionContextInterface, A string) error {
	err := ctx.GetStub().DelState(A)
	if err != nil {
		return fmt.Errorf("Failed to delete state")
	}
	return nil
}

// ✅ 잔액 조회 기능 (변경 없음)
func (t *ABstore) Query(ctx contractapi.TransactionContextInterface, A string) (string, error) {
	var err error
	Avalbytes, err := ctx.GetStub().GetState(A)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return "", errors.New(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
		return "", errors.New(jsonResp)
	}

	jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return string(Avalbytes), nil
}

// ✅ 전체 잔액 조회 기능 (변경 없음)
func (t *ABstore) GetAllQuery(ctx contractapi.TransactionContextInterface) ([]string, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var wallet []string
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		jsonResp := "{\"Name\":\"" + string(queryResponse.Key) + "\",\"Amount\":\"" + string(queryResponse.Value) + "\"}"
		wallet = append(wallet, jsonResp)
	}
	return wallet, nil
}

// ✅ main 함수 (변경 없음)
func main() {
	cc, err := contractapi.NewChaincode(new(ABstore))
	if err != nil {
		panic(err.Error())
	}
	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting ABstore chaincode: %s", err)
	}
}
